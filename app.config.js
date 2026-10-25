module.exports = ({ config }) => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const plugins = config.plugins ?? [];

  return {
    ...config,
    plugins: [
      ...plugins,
      ...(androidGoogleMapsApiKey
        ? [[
            'react-native-maps',
            { androidGoogleMapsApiKey },
          ]]
        : []),
    ],
  };
};
