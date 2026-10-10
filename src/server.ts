import app from "./app";
import config from "./config";

app.listen(config.port, () => {
    console.log(`RentNest server is running on port ${config.port}`);
});

export default app;
