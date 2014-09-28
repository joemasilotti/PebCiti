#include <pebble.h>

static Window *window;
static TextLayer *focus_layer;
static TextLayer *station_layer;
static TextLayer *distance_layer;
static uint8_t focusIsBike;
static uint8_t vibrate;
static uint8_t unit;
static AppSync sync;
static uint8_t sync_buffer[124];

enum PebBikeKey {
    PEB_BIKE_FOCUS_IS_BIKE_KEY = 0x0,
    PEB_BIKE_STATION_KEY = 0x1,
    PEB_BIKE_VIBRATE_KEY = 0x2,
	PEB_BIKE_DISTANCE_KEY = 0x3
};

static void set_focus(uint8_t newFocusIsBike)
{
    char *focusText;
    if (newFocusIsBike == 1) {
        focusIsBike = 1;
        focusText = "Closest Available Bike:";
    } else {
        focusIsBike = 0;
        focusText = "Closest Open Dock:";
    }
    text_layer_set_text(focus_layer, focusText);
}

static void sync_tuple_changed_callback(const uint32_t key, const Tuple *new_tuple, const Tuple *old_tuple, void *context)
{
    switch (key) {
        case PEB_BIKE_FOCUS_IS_BIKE_KEY:
            set_focus(new_tuple->value->uint8);
            break;
        case PEB_BIKE_STATION_KEY:
            text_layer_set_text(station_layer, new_tuple->value->cstring);
            break;
        case PEB_BIKE_VIBRATE_KEY:
            vibrate = new_tuple->value->uint8;
            break;
        case PEB_BIKE_DISTANCE_KEY:
			text_layer_set_text(distance_layer, new_tuple->value->cstring);
            break;
    }

    if (vibrate == 1) {
        vibes_short_pulse();
    }
}

void select_single_click_handler(ClickRecognizerRef recognizer, void *context)
{
    uint8_t newFocus = focusIsBike ? 0 : 1;
    Tuplet new_tuple[] = { TupletInteger(0, newFocus) };
    app_sync_set(&sync, new_tuple, ARRAY_LENGTH(new_tuple));
}

static void click_config_provider(Window *window)
{
    window_single_click_subscribe(BUTTON_ID_SELECT, select_single_click_handler);
}

static void window_load(Window *window)
{
    Layer *window_layer = window_get_root_layer(window);

    focus_layer = text_layer_create(GRect(5, 10, 134, 25));
    text_layer_set_font(focus_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18));
    layer_add_child(window_layer, text_layer_get_layer(focus_layer));

	distance_layer = text_layer_create(GRect(5, 35, 134, 50));
    text_layer_set_font(distance_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
    text_layer_set_text_alignment(distance_layer, GTextAlignmentCenter);
    layer_add_child(window_layer, text_layer_get_layer(distance_layer));
	
    station_layer = text_layer_create(GRect(5, 55, 134, 90));
    text_layer_set_font(station_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
    text_layer_set_text_alignment(station_layer, GTextAlignmentCenter);
    layer_add_child(window_layer, text_layer_get_layer(station_layer));

    window_set_click_config_provider(window, (ClickConfigProvider) click_config_provider);
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

    focusIsBike = 1;
    vibrate = 0;
	unit = 0;

    Tuplet initial_values[] = {
        TupletInteger(PEB_BIKE_FOCUS_IS_BIKE_KEY, focusIsBike),
        TupletCString(PEB_BIKE_STATION_KEY, "Wating for phone app..."),
		TupletCString(PEB_BIKE_DISTANCE_KEY, "")
    };

    const int inbound_size = 124;
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
