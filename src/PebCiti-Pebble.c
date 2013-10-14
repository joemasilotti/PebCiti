#include "pebble_os.h"
#include "pebble_app.h"
#include "pebble_fonts.h"

#define MY_UUID { 0xF6, 0xBB, 0x82, 0xD0, 0xB5, 0xBF, 0x4E, 0xC7, 0xA9, 0x7A, 0x40, 0x5D, 0x3A, 0x35, 0x04, 0x44 }

PBL_APP_INFO(MY_UUID, "PebCiti", "Masilotti.com", 1, 0, DEFAULT_MENU_ICON, APP_INFO_STANDARD_APP);

static struct PebCitiData
{
    Window window;
    TextLayer text_layer;
    AppSync sync;
    uint8_t sync_buffer[32];
} s_data;

enum {
    PEB_CITI_TEXT_KEY = 0x1
};

static void sync_tuple_changed_callback(const uint32_t key, const Tuple *new_tuple, const Tuple *old_tuple, void *context)
{
    text_layer_set_text(&s_data.text_layer, new_tuple->value->cstring);
}

static void peb_citi_init(AppContextRef context)
{
    Window *window = &s_data.window;
    window_init(window, "PebCiti");

    text_layer_init(&s_data.text_layer, GRect(0, 100, 144, 68));
    layer_add_child(&window->layer, &s_data.text_layer.layer);
    text_layer_set_text_alignment(&s_data.text_layer, GTextAlignmentCenter);

    Tuplet initial_values[] = {
        TupletCString(PEB_CITI_TEXT_KEY, "<empty>")
    };

    app_sync_init(&s_data.sync,
                  s_data.sync_buffer,
                  sizeof(s_data.sync_buffer),
                  initial_values,
                  ARRAY_LENGTH(initial_values),
                  sync_tuple_changed_callback,
                  NULL,
                  NULL);

    window_stack_push(window, true);
}

static void peb_citi_deinit(AppContextRef context)
{
    app_sync_deinit(&s_data.sync);
}

void pbl_main(void *params)
{
    PebbleAppHandlers handlers = {
        .init_handler = &peb_citi_init,
        .deinit_handler = &peb_citi_deinit,
        .messaging_info = {
            .buffer_sizes = {
                .inbound = 64,
                .outbound = 16
            }
        }
    };
    app_event_loop(params, &handlers);
}
