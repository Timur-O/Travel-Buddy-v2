self.onmessage = async (e) => {
  const { id, countryId, resolution, path, baseUrl } = e.data;
  try {
    const response = await fetch(
      new URL(`/assets/data/geojson/${resolution}/${path}`, baseUrl),
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load GeoJSON for ${countryId}: HTTP ${response.status}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('json')) {
      throw new Error(
        `Invalid content type for ${countryId}: Expected JSON, got ${contentType}`
      );
    }

    const data = await response.json();
    self.postMessage({ id, success: true, data });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    self.postMessage({ id, success: false, error: errorMessage });
  }
};
