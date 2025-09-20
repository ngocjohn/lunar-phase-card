export const MAIN_WINDOW_NAME = 'ha-main-window';

export const mainWindow = window.name === MAIN_WINDOW_NAME ? window : parent.name === MAIN_WINDOW_NAME ? parent : top!;
