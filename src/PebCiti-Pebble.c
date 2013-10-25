#include "pebble_os.h"
#include "pebble_app.h"
#include "pebble_fonts.h"

static Window *window;
static TextLayer *text_layer;
static AppSync sync;
static uint8_t sync_buffer[32];

enum PebCitiKey {
    PEB_CITI_TEXT_KEY = 0x1
};

static void sync_tuple_changed_callback(const uint32_t key, const Tuple *new_tuple, const Tuple *old_tuple, void *context)
{
    text_layer_set_text(text_layer, new_tuple->value->cstring);
}

static void window_load(Window *window)
{
    Layer *window_layer = window_get_root_layer(window);

    text_layer = text_layer_create(GRect(0, 100, 144, 68));
    text_layer_set_text_alignment(text_layer, GTextAlignmentCenter);
    layer_add_child(window_layer, text_layer_get_layer(text_layer));
}

static void window_unload(Window *window)
{
    text_layer_destroy(text_layer);
}

static void init()
{
    window = window_create();
    window_set_window_handlers(window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload
    });

    Tuplet initial_values[] = {
        TupletCString(PEB_CITI_TEXT_KEY, "<empty>")
    };

    const int inbound_size = 64;
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
