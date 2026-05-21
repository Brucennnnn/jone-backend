import { createApp } from "./app.js";
import { createFakeAnalysisService } from "./analysis/fakeAnalysisService.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp(config, {
  analysisService: createFakeAnalysisService()
});

app.listen(config.port, config.host, () => {
  console.log(
    `Jone backend listening on http://${config.host}:${config.port}`
  );
});
