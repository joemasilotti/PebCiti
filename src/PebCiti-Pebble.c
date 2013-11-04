#include "pebble_os.h"
#include "pebble_app.h"
#include "pebble_fonts.h"

static Window *window;
static TextLayer *focus_layer;
static TextLayer *station_layer;
static uint8_t vibrate;
static AppSync sync;
static uint8_t sync_buffer[144];

enum PebCitiKey {
    PEB_CITI_FOCUS_KEY = 0x0,
    PEB_CITI_STATION_KEY = 0x1,
    PEB_CITI_VIBRATE_KEY = 0x2
};

static void sync_tuple_changed_callback(const uint32_t key, const Tuple *new_tuple, const Tuple *old_tuple, void *context)
{
    switch (key) {
        case PEB_CITI_FOCUS_KEY:
            text_layer_set_text(focus_layer, new_tuple->value->cstring);
            break;
        case PEB_CITI_STATION_KEY:
            text_layer_set_text(station_layer, new_tuple->value->cstring);
            break;
        case PEB_CITI_VIBRATE_KEY:
            vibrate = new_tuple->value->uint8;
            break;
    }

    if (vibrate == 1) {
        vibes_short_pulse();
    }
}

static void window_load(Window *window)
{
    Layer *window_layer = window_get_root_layer(window);

    focus_layer = text_layer_create(GRect(5, 10, 134, 25));
    text_layer_set_font(focus_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18));
    layer_add_child(window_layer, text_layer_get_layer(focus_layer));

    station_layer = text_layer_create(GRect(5, 30, 134, 65));
    text_layer_set_font(station_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
    text_layer_set_text_alignment(station_layer, GTextAlignmentCenter);
    layer_add_child(window_layer, text_layer_get_layer(station_layer));
}

static void window_unload(Window *window)
{
    text_layer_destroy(focus_layer);
    text_layer_destroy(station_layer);
}

static void init()
{
    window = window_create();
    window_set_window_handlers(window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload
    });

    vibrate = 0;

    Tuplet initial_values[] = {
        TupletCString(PEB_CITI_FOCUS_KEY, "Closest Available Bike:"),
        TupletCString(PEB_CITI_STATION_KEY, "Wating for iPhone app..."),
        TupletInteger(PEB_CITI_VIBRATE_KEY, (uint8_t) 0)
    };

    const int inbound_size = 128;
    const int outbound_size = 16;
    app_message_open(inbound_size, outbound_size);

    app_sync_init(&sync,
                  sync_buffer,
                  sizeof(sync_buffer),
                  initial_values,
                  ARRAY_LENGTH(initial_values),
                  sync_tuple_changed_callback,
                  NULL,
                  NULL);

    window_stack_push(window, true);
}

static void deinit()
{
    app_sync_deinit(&sync);
    window_destroy(window);
}

int main(void)
{
    init();
    app_event_loop();
    deinit();
}
