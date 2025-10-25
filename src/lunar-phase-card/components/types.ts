import * as COMPONENTS from './index';

declare global {
  interface Window {
    LunarHeader: COMPONENTS.LunarHeader;
    LunarChartDynamic: COMPONENTS.LunarMoonChartDynamic;
    LunarDataBox: COMPONENTS.LunarMoonDataInfo;
    LunarMoonBase: COMPONENTS.LunarMoonBase;
    LunarCalendarFooter: COMPONENTS.LunarMoonCalendarFooter;
    LunarCompactView: COMPONENTS.LunarMoonCompactView;
    LunarPopup: COMPONENTS.LunarMoonCalendarPopup;
  }
}
