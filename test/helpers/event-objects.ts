export function createMouseEvent(type: string, x = 0, y = 0): MouseEvent {
    const event = document.createEvent('MouseEvent');

    event.initMouseEvent(
        type,
        false, /* canBubble */
        false, /* cancelable */
        window, /* view */
        0, /* detail */
        x, /* screenX */
        y, /* screenY */
        x, /* clientX */
        y, /* clientY */
        false, /* ctrlKey */
        false, /* altKey */
        false, /* shiftKey */
        false, /* metaKey */
        0, /* button */
        null, /* relatedTarget */
    );

    return event;
}


/** Dispatches a keydown event from an element. */
export function createKeyboardEvent(
    type: string,
    keyCode: number,
    target?: Element,
    key?: string,
): KeyboardEvent {

    const event = document.createEvent('KeyboardEvent') as any;
    // Firefox does not support `initKeyboardEvent`, but supports `initKeyEvent`.
    const initEventFn = (event.initKeyEvent || event.initKeyboardEvent).bind(event);
    const originalPreventDefault = event.preventDefault;

    initEventFn(type, true, true, window, 0, 0, 0, 0, 0, keyCode);

    // Webkit Browsers don't set the keyCode when calling the init function.
    // See related bug https://bugs.webkit.org/show_bug.cgi?id=16735
    Object.defineProperties(event, {
        keyCode: { get: () => keyCode },
        key: { get: () => key },
        target: { get: () => target },
    });

    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = function () {
        Object.defineProperty(event, 'defaultPrevented', { get: () => true });
        return originalPreventDefault.apply(this, arguments);
    };

    return event;
}

/** Creates a fake event object with any desired event type. */
export function createFakeEvent(type: string, canBubble = false, cancelable = true): Event {
    const event = document.createEvent('Event');
    event.initEvent(type, canBubble, cancelable);
    return event;
}
