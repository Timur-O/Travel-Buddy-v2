<template>
  <div class="map-container" ref="mapContainer"></div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  watch,
  shallowRef,
} from 'vue';
import L from 'leaflet';
import { debounce } from 'lodash';
import 'leaflet/dist/leaflet.css';
import { Country, UserData, VisitStatus } from 'src/models';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { WorkerPool } from 'src/workers/WorkerPool';

interface IsoData {
  center_lat: number;
  center_lon: number;
  geojson_path: string;
}

interface IsoRecord {
  [key: string]: IsoData;
}

interface AreaLayer extends L.GeoJSON {
  area?: number;
}

interface CountryProperties {
  id: string;
  status: VisitStatus;
}

export default defineComponent({
  name: 'LeafletMap',
  props: {
    countries: {
      type: Array as PropType<Country[]>,
      required: true,
    },
    userData: {
      type: Array as PropType<UserData[]>,
      required: true,
    },
  },
  emits: ['countryClick'],
  setup(props, { emit }) {
    const iso1 = shallowRef<IsoRecord>({});
    const iso2 = shallowRef<IsoRecord>({});
    const mapContainer = ref<HTMLElement | null>(null);
    let map: L.Map | null = null;
    let countryFeatureGroup: L.FeatureGroup | null = null;
    let markerFeatureGroup: L.FeatureGroup | null = null;
    let layerControl: L.Control.Layers | null = null;

    const styles = Object.freeze({
      [VisitStatus.Visited]: {
        color: '#7ac686',
        weight: 2,
        fillOpacity: 0.3,
      },
      [VisitStatus.Upcoming]: {
        color: '#6ba4db',
        weight: 2,
        fillOpacity: 0.3,
      },
      [VisitStatus.Unvisited]: {
        color: '#c66b78',
        weight: 2,
        fillOpacity: 0.2,
      },
    });

    const selectedLayer = shallowRef<L.GeoJSON | null>(null);
    const workerPool = new WorkerPool(
      new URL('../workers/geojson.worker.js', import.meta.url).href,
      Math.min(4, navigator.hardwareConcurrency || 2)
    );

    const memoryCache = new Map();
    const highResCountries = new Set<string>();
    const layerPool = new Map<string, L.GeoJSON>();
    const CACHE_LIMIT = 30;
    const errorLog = new Map<string, number>();
    const isDrawing = ref(false);

    const selectCountry = (layer: L.GeoJSON) => {
      if (selectedLayer.value) {
        const userData = props.userData?.find(
          (d) =>
            d.countryId ===
            (selectedLayer.value?.feature as Feature)?.properties?.id
        );
        selectedLayer.value.setStyle(
          styles[userData?.status || VisitStatus.Unvisited]
        );
      }

      layer.setStyle({
        ...styles[
          (layer.feature as Feature<Geometry, CountryProperties>)?.properties
            ?.status || VisitStatus.Unvisited
        ],
        color: '#ff8c00',
        weight: 3,
      });

      selectedLayer.value = layer;
    };

    const isInViewport = (layer: L.Layer): boolean => {
      if (!map) return false;
      return map.getBounds().intersects((layer as L.GeoJSON).getBounds());
    };

    const getCountryCenter = (countryId: string): L.LatLng => {
      const data = iso1.value[countryId] || iso2.value[countryId];
      if (!data) throw new Error('Invalid Country ID.');
      return new L.LatLng(data.center_lat, data.center_lon);
    };

    const debouncedViewportCheck = debounce(async () => {
      if (!map || map.getZoom() <= 6) return;

      const bounds = map.getBounds();
      const layers = countryFeatureGroup
        ?.getLayers()
        .filter((layer) => isInViewport(layer)) as L.GeoJSON[];

      await Promise.all(
        layers.map(async (layer, i) => {
          const country = props.countries[i];
          if (
            layer.getBounds().intersects(bounds) &&
            !highResCountries.has(country.id)
          ) {
            const highResGeoJson = await getCountryGeoJson(country.id, 'high');
            layer.clearLayers();
            layer.addData(highResGeoJson);
            highResCountries.add(country.id);
          }
        })
      );
    }, 150);

    const debouncedErrorReport = debounce(() => {
      if (errorLog.size > 0) {
        console.group('Map Loading Status');
        errorLog.forEach((count, error) => {
          console.info(`${error} (${count} occurrences)`);
        });
        console.groupEnd();
        errorLog.clear();
      }
    }, 1000);

    const manageMemory = debounce(() => {
      if (!map) return;

      const visibleBounds = map.getBounds();
      const removeLayers: L.Layer[] = [];

      countryFeatureGroup?.getLayers().forEach((layer) => {
        const geoJsonLayer = layer as L.GeoJSON;
        const feature = geoJsonLayer.toGeoJSON() as Feature;
        const countryId = feature?.properties?.id;

        if (countryId && !isInViewport(geoJsonLayer)) {
          layerPool.set(countryId, geoJsonLayer);
          removeLayers.push(geoJsonLayer);
        }
      });

      removeLayers.forEach((layer) => countryFeatureGroup?.removeLayer(layer));

      if (memoryCache.size > CACHE_LIMIT) {
        const keysToDelete = Array.from(memoryCache.keys())
          .filter((key) => {
            const countryId = key.split('-')[0];
            const center = getCountryCenter(countryId);
            return !visibleBounds.contains(center);
          })
          .slice(0, memoryCache.size - CACHE_LIMIT);

        keysToDelete.forEach((key) => memoryCache.delete(key));
      }

      if (layerPool.size > CACHE_LIMIT) {
        const poolKeys = Array.from(layerPool.keys());
        poolKeys
          .slice(0, poolKeys.length - CACHE_LIMIT)
          .forEach((key) => layerPool.delete(key));
      }
    }, 200);

    const updateMarkerVisibility = debounce(() => {
      if (!map || !markerFeatureGroup) return;
      const zoom = map.getZoom();
      const display = zoom >= 4 ? 'block' : 'none';

      markerFeatureGroup.getLayers().forEach((layer) => {
        const element = (layer as L.Marker).getElement();
        if (element) {
          element.style.display = display;
        }
      });
    }, 100);

    const getCountryGeoJson = async (
      countryId: string,
      resolution: 'low' | 'high' = 'low'
    ): Promise<FeatureCollection | Feature<Geometry>> => {
      const cacheKey = `${countryId}-${resolution}`;

      if (memoryCache.has(cacheKey)) {
        return JSON.parse(memoryCache.get(cacheKey));
      }

      const browserCache = await caches.open('geojson-cache');
      const browserCachedResponse = await browserCache.match(cacheKey);

      if (browserCachedResponse) {
        const data = await browserCachedResponse.json();
        memoryCache.set(cacheKey, JSON.stringify(data));
        return data;
      }

      const geojsonPath = (iso1.value[countryId] || iso2.value[countryId])
        ?.geojson_path;
      if (!geojsonPath) throw new Error('Invalid Country ID.');

      const result = await workerPool.execute({
        countryId,
        resolution,
        path: geojsonPath,
        baseUrl: document.baseURI,
      });

      if (!result.success) throw new Error(result.error);

      const data = result.data;
      memoryCache.set(cacheKey, JSON.stringify(data));
      await browserCache.put(
        cacheKey,
        new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      return data;
    };

    const getOrCreateCountryLayer = (
      country: Country,
      geoJsonData: Feature<Geometry> | FeatureCollection<Geometry>
    ) => {
      const pooledLayer = layerPool.get(country.id);
      if (pooledLayer) {
        layerPool.delete(country.id);
        return pooledLayer;
      }

      const layer = L.geoJSON(geoJsonData, {
        pane: 'countries',
        style: () =>
          styles[
            props.userData?.find((d) => d.countryId === country.id)?.status ||
              VisitStatus.Unvisited
          ],
        onEachFeature: (feature, layer) => {
          const bounds = (layer as L.Polygon).getBounds();
          (layer as AreaLayer).area =
            Math.abs(bounds.getNorth() - bounds.getSouth()) *
            Math.abs(bounds.getEast() - bounds.getWest());

          layer.on('click', () => {
            selectCountry(layer as L.GeoJSON);
            emit('countryClick', country.id);
          });
        },
      }) as AreaLayer;

      layer.setZIndex(1000 - Math.floor(layer.area! * 1000));
      return layer;
    };

    const drawCountries = async () => {
      if (!map) return;

      if (layerControl) {
        layerControl.remove();
        layerControl = null;
      }

      if (countryFeatureGroup && map.hasLayer(countryFeatureGroup)) {
        countryFeatureGroup.clearLayers();
        map.removeLayer(countryFeatureGroup);
      }

      if (markerFeatureGroup && map.hasLayer(markerFeatureGroup)) {
        markerFeatureGroup.clearLayers();
        map.removeLayer(markerFeatureGroup);
      }

      countryFeatureGroup = L.featureGroup();
      markerFeatureGroup = L.featureGroup();

      const worldOffsets = [-360, 0, 360];

      await Promise.all(
        props.countries.map(async (country) => {
          try {
            const geoJsonFeature = await getCountryGeoJson(
              country.id,
              highResCountries.has(country.id) ? 'high' : 'low'
            );

            worldOffsets.forEach((offset) => {
              const shiftedGeoJson = JSON.parse(JSON.stringify(geoJsonFeature));
              if (shiftedGeoJson.type === 'FeatureCollection') {
                shiftedGeoJson.features.forEach((feature: Feature) => {
                  if (
                    feature.geometry.type === 'Polygon' ||
                    feature.geometry.type === 'MultiPolygon'
                  ) {
                    const geometry = feature.geometry;
                    if (geometry.type === 'Polygon') {
                      geometry.coordinates = geometry.coordinates.map(
                        (ring: number[][]) =>
                          ring.map((coord: number[]) => [
                            coord[0] + offset,
                            coord[1],
                          ])
                      );
                    } else {
                      geometry.coordinates = geometry.coordinates.map(
                        (polygon: number[][][]) =>
                          polygon.map((ring: number[][]) =>
                            ring.map((coord: number[]) => [
                              coord[0] + offset,
                              coord[1],
                            ])
                          )
                      );
                    }
                  }
                });
              }

              const countryLayer = getOrCreateCountryLayer(
                country,
                geoJsonFeature
              );
              const center = getCountryCenter(country.id);
              const shiftedCenter = L.latLng(center.lat, center.lng + offset);

              const flagIcon = L.divIcon({
                html: `<div class="pin"><div class="flag-container">${country.flag}</div></div>`,
                className: 'country-flag-marker',
                iconSize: [30, 40],
                iconAnchor: [15, 40],
              });

              const marker = L.marker(shiftedCenter, {
                icon: flagIcon,
              }).on('click', () => {
                if (selectedLayer.value) {
                  const userData = props.userData?.find(
                    (d) =>
                      d.countryId ===
                      (selectedLayer.value?.feature as Feature)?.properties?.id
                  );
                  selectedLayer.value.setStyle(
                    styles[userData?.status || VisitStatus.Unvisited]
                  );
                }
                selectedLayer.value = null;
                emit('countryClick', country.id);
              });

              marker.on('add', () => {
                const element = marker.getElement();
                if (element) {
                  element.style.display =
                    map!.getZoom() >= 4 ? 'block' : 'none';
                }
              });

              if (isInViewport(countryLayer)) {
                countryFeatureGroup!.addLayer(countryLayer);
                markerFeatureGroup!.addLayer(marker);
              }
            });
          } catch (e) {
            const errorMessage =
              e instanceof Error ? e.message : 'Unknown error';
            const errorKey = `${country.name}: ${errorMessage}`;
            errorLog.set(errorKey, (errorLog.get(errorKey) || 0) + 1);
            debouncedErrorReport();
          }
        })
      );

      countryFeatureGroup.addTo(map);
      markerFeatureGroup.addTo(map);

      map.on('zoomend moveend', () => {
        debouncedViewportCheck();
        updateMarkerVisibility();
      });

      layerControl = L.control
        .layers(undefined, {
          Coloring: countryFeatureGroup,
          Pins: markerFeatureGroup,
        })
        .addTo(map);

      if (countryFeatureGroup.getBounds().isValid()) {
        map.fitBounds(countryFeatureGroup.getBounds(), {
          padding: [50, 50],
        });
      }
    };

    onMounted(async () => {
      const [iso1Data, iso2Data] = await Promise.all([
        fetch('/assets/data/iso1.json').then((res) => res.json()),
        fetch('/assets/data/iso2.json').then((res) => res.json()),
      ]);

      iso1.value = iso1Data;
      iso2.value = iso2Data;

      if (mapContainer.value) {
        map = L.map(mapContainer.value, {
          center: [20, 0],
          zoom: 2,
          minZoom: 2,
          worldCopyJump: true,
          maxBounds: L.latLngBounds(
            L.latLng(-90, -Infinity),
            L.latLng(90, Infinity)
          ),
          maxBoundsViscosity: 1.0,
          preferCanvas: true,
          renderer: L.canvas(),
        });

        map.createPane('countries');
        const countriesPane = map.getPane('countries');
        if (countriesPane) {
          countriesPane.style.zIndex = '400';
        }

        map.on('moveend', manageMemory);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          noWrap: false,
          keepBuffer: 4,
          updateWhenIdle: true,
          updateWhenZooming: false,
          maxZoom: 15,
          preferCanvas: true,
          bounds: map?.getBounds(),
        } as L.TileLayerOptions).addTo(map);
      }
    });

    onUnmounted(() => {
      workerPool.terminate();
      map?.remove();
      map = null;
    });

    watch(
      [() => props.countries, () => props.userData],
      () => {
        if (!isDrawing.value) {
          isDrawing.value = true;
          requestAnimationFrame(() => {
            drawCountries();
            isDrawing.value = false;
          });
        }
      },
      { deep: true, flush: 'post' }
    );

    return {
      mapContainer,
    };
  },
});
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

.map-container {
  height: calc(100vh - 50px);
  width: 100%;
  z-index: 1;
  will-change: transform;
}

:global(.country-flag-marker) {
  background: none;
  border: none;
}

:global(.country-flag-marker .pin) {
  width: 40px;
  height: 40px;
  background: $bg;
  border: 2px solid $primary;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba($secondary, 0.2);
}

:global(.country-flag-marker .flag-container) {
  transform: rotate(45deg);
  font-size: 16px;
}
</style>
