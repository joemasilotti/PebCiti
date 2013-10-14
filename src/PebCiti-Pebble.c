#include "pebble_os.h"
#include "pebble_app.h"
#include "pebble_fonts.h"

#define MY_UUID { 0xF6, 0xBB, 0x82, 0xD0, 0xB5, 0xBF, 0x4E, 0xC7, 0xA9, 0x7A, 0x40, 0x5D, 0x3A, 0x35, 0x04, 0x44 }

PBL_APP_INFO(MY_UUID, "PebCiti", "Masilotti.com", 1, 0, DEFAULT_MENU_ICON, APP_INFO_STANDARD_APP);

Window window;

void handle_init(AppContextRef ctx)
{
  window_init(&window, "Window Name");
  window_stack_push(&window, true);
}

void pbl_main(void *params)
{
  PebbleAppHandlers handlers = {
    .init_handler = &handle_init
  };
  app_event_loop(params, &handlers);
}
