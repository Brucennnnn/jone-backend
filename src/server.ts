import { createApp } from "./app.js";
import { createUnavailableAnalysisService } from "./analysis/unavailableAnalysisService.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp(config, {
  analysisService: createUnavailableAnalysisService()
});

app.listen(config.port, config.host, () => {
  console.log(
    `Jone backend listening on http://${config.host}:${config.port}`
  );
});
