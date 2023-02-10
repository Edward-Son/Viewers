import Hotkey from '../classes/Hotkey';

interface AppConfig {
  extensions?: string[];
  defaultDataSourceName?: string;
  hotkeys?: Record<string, Hotkey> | Hotkey[];
}
export default AppConfig;
