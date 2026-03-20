export default () => ({
  app: {
    name: 'pataspace-api',
    port: Number(process.env.PORT ?? 3000),
  },
});
