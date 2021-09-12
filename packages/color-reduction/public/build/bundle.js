
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const initialState$2 = {
        file: null
    };
    function createApp() {
        const { subscribe, set, update } = writable(initialState$2);
        return {
            subscribe,
            reset: () => set(initialState$2),
            set: (val) => set(val),
        };
    }
    const app$1 = createApp();

    const Steps = [
        {
            title: 'Sampling',
            list: [
                'Sampling the original image for color statistics.'
            ]
        },
        {
            title: 'Splitting',
            list: [
                'Put all the pixels of the image (that is, their RGB values) in a bucket.',
                'Find out which color channel (red, green, or blue) among the pixels in the bucket has the greatest range, then sort the pixels according to that channel\'s values.',
                'After the bucket has been sorted, move the upper half of the pixels into a new bucket.'
            ]
        },
        {
            title: 'Calculate the average color',
            list: [
                'Average the pixels in each bucket and you have a palette of 16 colors.'
            ]
        },
        {
            title: 'Mapping',
            list: [
                'Mapping the colors to their representative in the color map.'
            ]
        },
    ];
    const initialState$1 = {
        steps: Steps,
        current: 0
    };
    function createSteps() {
        const { subscribe, set, update } = writable(initialState$1);
        return {
            subscribe,
            reset: () => set(initialState$1),
            update: (val) => set(Object.assign(Object.assign({}, initialState$1), { current: val })),
            set: (val) => set(val),
        };
    }
    const steps = createSteps();

    /* src/components/Nav.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/components/Nav.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (9:8) {#if i < $steps.steps.length - 1}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "-ml-px absolute mt-0.5 top-4 left-4 w-0.5 h-full bg-gray-600");
    			attr_dev(div, "aria-hidden", "true");
    			add_location(div, file$3, 9, 10, 305);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(9:8) {#if i < $steps.steps.length - 1}",
    		ctx
    	});

    	return block;
    }

    // (14:10) {#if i < $steps.current}
    function create_if_block_2(ctx) {
    	let span1;
    	let span0;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$3, 24, 18, 1034);
    			attr_dev(svg, "class", "w-5 h-5 text-white");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "aria-hidden", "true");
    			add_location(svg, file$3, 18, 16, 799);
    			attr_dev(span0, "class", "relative z-10 w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full group-hover:bg-gray-800");
    			add_location(span0, file$3, 15, 14, 602);
    			attr_dev(span1, "class", "h-9 flex items-center");
    			add_location(span1, file$3, 14, 12, 551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span0, svg);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(14:10) {#if i < $steps.current}",
    		ctx
    	});

    	return block;
    }

    // (33:10) {#if i === $steps.current}
    function create_if_block_1(ctx) {
    	let span2;
    	let span1;
    	let span0;

    	const block = {
    		c: function create() {
    			span2 = element("span");
    			span1 = element("span");
    			span0 = element("span");
    			attr_dev(span0, "class", "h-2.5 w-2.5 bg-gray-600 rounded-full");
    			add_location(span0, file$3, 36, 16, 1616);
    			attr_dev(span1, "class", "relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-600 rounded-full");
    			add_location(span1, file$3, 34, 14, 1467);
    			attr_dev(span2, "class", "h-9 flex items-center");
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$3, 33, 12, 1397);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span2, anchor);
    			append_dev(span2, span1);
    			append_dev(span1, span0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(33:10) {#if i === $steps.current}",
    		ctx
    	});

    	return block;
    }

    // (41:10) {#if $steps.current < i}
    function create_if_block$1(ctx) {
    	let span2;
    	let span1;
    	let span0;

    	const block = {
    		c: function create() {
    			span2 = element("span");
    			span1 = element("span");
    			span0 = element("span");
    			attr_dev(span0, "class", "h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300");
    			add_location(span0, file$3, 44, 16, 2027);
    			attr_dev(span1, "class", "relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full group-hover:border-gray-400");
    			add_location(span1, file$3, 42, 14, 1850);
    			attr_dev(span2, "class", "h-9 flex items-center");
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$3, 41, 12, 1780);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span2, anchor);
    			append_dev(span2, span1);
    			append_dev(span1, span0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(41:10) {#if $steps.current < i}",
    		ctx
    	});

    	return block;
    }

    // (51:12) {#each item.list as children, j}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*children*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "text-sm text-gray-500");
    			add_location(span, file$3, 51, 14, 2398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$steps*/ 1 && t_value !== (t_value = /*children*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(51:12) {#each item.list as children, j}",
    		ctx
    	});

    	return block;
    }

    // (7:4) {#each $steps.steps as item, i}
    function create_each_block(ctx) {
    	let li;
    	let t0;
    	let div;
    	let t1;
    	let t2;
    	let t3;
    	let span1;
    	let span0;
    	let t4_value = /*item*/ ctx[1].title + "";
    	let t4;
    	let t5;
    	let t6;
    	let if_block0 = /*i*/ ctx[3] < /*$steps*/ ctx[0].steps.length - 1 && create_if_block_3(ctx);
    	let if_block1 = /*i*/ ctx[3] < /*$steps*/ ctx[0].current && create_if_block_2(ctx);
    	let if_block2 = /*i*/ ctx[3] === /*$steps*/ ctx[0].current && create_if_block_1(ctx);
    	let if_block3 = /*$steps*/ ctx[0].current < /*i*/ ctx[3] && create_if_block$1(ctx);
    	let each_value_1 = /*item*/ ctx[1].list;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			span1 = element("span");
    			span0 = element("span");
    			t4 = text(t4_value);
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			attr_dev(span0, "class", "text-xs font-semibold uppercase tracking-wide text-gray-300");
    			add_location(span0, file$3, 49, 12, 2245);
    			attr_dev(span1, "class", "ml-4 min-w-0 flex flex-col space-y-1");
    			add_location(span1, file$3, 48, 10, 2181);
    			attr_dev(div, "class", "relative flex items-start group");
    			add_location(div, file$3, 12, 8, 458);
    			attr_dev(li, "class", "relative pb-10");
    			toggle_class(li, "pb-10", /*i*/ ctx[3] < /*$steps*/ ctx[0].steps.length - 1);
    			add_location(li, file$3, 7, 6, 179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if (if_block0) if_block0.m(li, null);
    			append_dev(li, t0);
    			append_dev(li, div);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			append_dev(div, t3);
    			append_dev(div, span1);
    			append_dev(span1, span0);
    			append_dev(span0, t4);
    			append_dev(span1, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span1, null);
    			}

    			append_dev(li, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (/*i*/ ctx[3] < /*$steps*/ ctx[0].steps.length - 1) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(li, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*i*/ ctx[3] < /*$steps*/ ctx[0].current) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*i*/ ctx[3] === /*$steps*/ ctx[0].current) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$steps*/ ctx[0].current < /*i*/ ctx[3]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					if_block3.m(div, t3);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*$steps*/ 1 && t4_value !== (t4_value = /*item*/ ctx[1].title + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$steps*/ 1) {
    				each_value_1 = /*item*/ ctx[1].list;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(span1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*$steps*/ 1) {
    				toggle_class(li, "pb-10", /*i*/ ctx[3] < /*$steps*/ ctx[0].steps.length - 1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:4) {#each $steps.steps as item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let ol;
    	let each_value = /*$steps*/ ctx[0].steps;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ol, "class", "overflow-hidden");
    			add_location(ol, file$3, 5, 2, 108);
    			attr_dev(nav, "aria-label", "Progress");
    			attr_dev(nav, "class", "max-w-sm");
    			add_location(nav, file$3, 4, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ol);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$steps*/ 1) {
    				each_value = /*$steps*/ ctx[0].steps;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $steps;
    	validate_store(steps, "steps");
    	component_subscribe($$self, steps, $$value => $$invalidate(0, $steps = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nav", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ steps, $steps });
    	return [$steps];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    var t;!function(t){t[t.R=0]="R",t[t.G=1]="G",t[t.B=2]="B";}(t||(t={}));var e=function(t,e){this.imageData=t,this.options=e||{strict:!1},this.colors=this.__calculateColorCount(this.imageData.data),this.buckets=[],this.__bucketsPerStep=[];},n={roundingBits:{configurable:!0},palette:{configurable:!0},bucketsPerStep:{configurable:!0}};e.averageColor=function(t){for(var e=0,n=0,r=0,a=0,o=0,i=t.length;o<i;o=o+1|0){var s=t[o],h=s[0],c=s[1],u=s[2],l=s[3];n=h*l+n,r=c*l+r,a=u*l+a,e=e+l|0;}return [Math.round(n/e),Math.round(r/e),Math.round(a/e)]},n.roundingBits.get=function(){return this.options.strict?255:248},n.palette.get=function(){for(var t=[],n=0,r=this.buckets.length;n<r;n=n+1|0)t[n]=e.averageColor(this.buckets[n].colors);return t},n.bucketsPerStep.get=function(){return this.__bucketsPerStep},e.prototype.reduce=function(t){if(this.colors.length<=t)return console.warn("It has already been reduced color."),this.imageData;this.buckets=this.__mediancut([this.__generateBucket(this.colors)],t);for(var n=new Map,r=0,a=this.buckets.length;r<a;r=r+1|0)for(var o=this.buckets[r],i=e.averageColor(o.colors),s=0,h=o.colors.length;s<h;s=s+1|0){var c=o.colors[s],u=c[0],l=c[1],g=c[2],m=u&this.roundingBits|(l&this.roundingBits)<<8|(g&this.roundingBits)<<16;n.set(m,i);}for(var f=this.imageData.data,p=f.length,d=new Uint8ClampedArray(p),_=0;_<p;){var v=f[_]&this.roundingBits|(f[_+1]&this.roundingBits)<<8|(f[_+2]&this.roundingBits)<<16,B=n.get(v),b=B[0],k=B[1],x=B[2];d[_]=b,d[_+1]=k,d[_+2]=x,d[_+3]=f[_+3],_=_+4|0;}return new ImageData(d,this.imageData.width,this.imageData.height)},e.prototype.__calculateColorCount=function(t){for(var e=new Map,n=t.length,r=0;r<n;){var a=t[r]&this.roundingBits,o=t[r+1]&this.roundingBits,i=t[r+2]&this.roundingBits,s=a|o<<8|i<<16,h=e.get(s),c=h?h[3]+1:1;e.set(s,[a,o,i,c]),r=r+4|0;}var u=[];return e.forEach((function(t){u[u.length]=t;})),u},e.prototype.__getTotalAnGreatestRangeChannel=function(e){for(var n=0,r=0,a=0,o=0,i=255,s=255,h=255,c=e.length,u=0;u<c;){var l=e[u],g=l[0],m=l[1],f=l[2],p=l[3];r=Math.max(g,r),a=Math.max(m,a),o=Math.max(f,o),i=Math.min(g,i),s=Math.min(m,s),h=Math.min(f,h),n+=p,u=u+1|0;}var d=1.2*(r-i),_=1.2*(a-s),v=o-h,B=Math.max(d,_,v),b=t.R;return d===B&&(b=t.R),_===B&&(b=t.G),v===B&&(b=t.B),{total:n,channel:b,minR:i,minG:s,minB:h,maxR:r,maxG:a,maxB:o}},e.prototype.__mediancut=function(t,e){this.__bucketsPerStep.push([].concat(t));var n=0,r=0;if(t.length+1>e)return t;for(var a=0,o=t.length;a<o;a=a+1|0)t[a].total>n&&1!==t[a].colors.length&&(r=a,n=t[a].total);var i=t[r];if(1===i.total||1===i.colors.length)return console.error("Cube could not be split."),t;var s=i.channel;i.colors.sort((function(t,e){return t[s]-e[s]}));var h=Math.floor((i.colors.length+1)/2),c=this.__generateBucket(i.colors.slice(0,h)),u=this.__generateBucket(i.colors.slice(h));return t.splice(r,1,c,u),this.__mediancut(t,e)},e.prototype.__generateBucket=function(t){var e=this.__getTotalAnGreatestRangeChannel(t);return {colors:t,total:e.total,channel:e.channel,minR:e.minR,minG:e.minG,minB:e.minB,maxR:e.maxR,maxG:e.maxG,maxB:e.maxB}},Object.defineProperties(e.prototype,n);

    var p = class extends HTMLElement {
      constructor(i, t, a = !0) {
        super();
        this.editing = !1;
        this.attachShadow({ mode: 'open' }),
          (this.axes = i),
          (this.totalTime = t),
          (this.debug = a),
          (this.shadowRoot.innerHTML = this.template(i, t)),
          (this.$pane = this.shadowRoot.querySelector('#pane')),
          (this.$timeline = this.shadowRoot.querySelector('#timeline')),
          (this.$current = this.shadowRoot.querySelector('#current')),
          (this.$progress = this.shadowRoot.querySelector('#progress')),
          (this.$labels = this.shadowRoot.querySelectorAll('.label')),
          (this.$bars = this.shadowRoot.querySelectorAll('.bar')),
          (this.$barsBegin = this.shadowRoot.querySelectorAll('.begin')),
          (this.$barsEnd = this.shadowRoot.querySelectorAll('.end')),
          (this.$previous = this.shadowRoot.querySelector('#previous')),
          (this.$playPause = this.shadowRoot.querySelector('#play-pause')),
          (this.$next = this.shadowRoot.querySelector('#next')),
          (this.playing = !0),
          (this.previous = !1),
          (this.next = !1),
          (this.skip = -1),
          this.$previous.addEventListener('click', (e) => {
            this.previous = !0;
          }),
          this.$playPause.addEventListener('click', (e) => {
            this.playing = !this.playing;
          }),
          this.$next.addEventListener('click', (e) => {
            this.next = !0;
          });
        for (let e = 0, n = this.$bars.length; e < n; e++) {
          if (
            (this.$bars[e].addEventListener('click', (l) => {
              let o = l.currentTarget,
                h = Number(o.getAttribute('idx'));
              this.skip = h;
            }),
            !this.debug)
          )
            continue;
          let r = this.$barsBegin[e],
            d = this.$barsEnd[e];
          r.addEventListener('input', (l) => {
            let o = Number(r.value);
            if (Number(this.$barsEnd[e].value) < o) {
              l.preventDefault();
              return;
            }
            if (Number.isFinite(this.axes[e].position))
              (this.axes[e].position = o),
                (this.axes[e].duration = this.axes[e].endAt - (this.axes[e].delay + this.axes[e].position));
            else {
              let h = this.axes.find((c) => c.key === this.axes[e].position);
              (this.axes[e].delay = o - h.endAt),
                (this.axes[e].duration = this.axes[e].endAt - (this.axes[e].delay + h.endAt));
            }
          }),
            d.addEventListener('input', (l) => {
              let o = Number(d.value);
              if (o < Number(this.$barsBegin[e].value)) {
                l.preventDefault();
                return;
              }
              if (Number.isFinite(this.axes[e].position))
                this.axes[e].duration = o - (this.axes[e].position + this.axes[e].delay);
              else {
                let h = this.axes.find((c) => c.key === this.axes[e].position);
                this.axes[e].duration = o - h.endAt - this.axes[e].delay;
              }
            });
        }
        this.$labels.forEach((e) => {
          e.addEventListener('click', (n) => {
            let s = n.currentTarget,
              r = Number(s.getAttribute('idx'));
            this.skip = r;
          });
        }),
          this.$current.addEventListener('input', (e) => {
            this.editing = !0;
            let n = Number(this.$current.value);
            this.__updateProgressPosition(n), this.__updateBar(this.totalTime);
          }),
          this.$current.addEventListener('change', (e) => {
            this.editing = !1;
          });
      }
      attributeChangedCallback() {}
      connectedCallback() {}
      disconnectedCallback() {}
      getAxes() {
        return this.axes;
      }
      get(i) {
        let t = Date.now(),
          a = Number(this.$current.value),
          e = t - i;
        if ((this.playing || ((i = t - a), (e = a)), this.editing && ((i = t - a), (e = a)), -1 < this.skip)) {
          let n = this.axes[this.skip];
          (i = t - n.beginAt), (e = n.beginAt), (this.skip = -1);
        }
        return (
          this.previous && ((this.previous = !1), (i = t), (e = 0)),
          this.next && ((this.next = !1), (i = t - this.totalTime), (e = this.totalTime)),
          { beginAt: i, elapsedTime: e, editing: this.editing }
        );
      }
      update(i, t, a) {
        (this.axes = a),
          (this.totalTime = t),
          this.$current.setAttribute('max', t),
          (this.$current.value = i),
          this.__updateProgressPosition(i),
          this.__updateBar(t),
          this.debug && this.__updateBarRange(t),
          this.__updateScale(t);
      }
      template(i, t) {
        let a = '',
          e = '',
          n = '';
        for (let s = 0; s < i.length; s++) {
          let r = i[s];
          a += `<div class="row" id="row-${s}"><div class="label" idx="${s}">${r.key}</div></div>`;
          let d = '';
          this.debug &&
            (d = `
          <input class="begin" type="range" min="0" max="0" step="10" value="${r.beginAt}">
          <input class="end" type="range" min="0" max="0" step="10" value="${r.endAt}">
        `),
            (e += `
        <div class="row">
          <div class="bar bar--${this.debug ? 'debug' : 'default'}" idx="${s}"></div>
          ${d}
        </div>`),
            this.debug;
        }
        for (let s = 0, r = Math.floor(t / 1e3); s < r; s++)
          n += `<div class="scale-label" style="--sec: ${s + 1}">${s + 1}s</div>`;
        return `
      <style>
        * {
          box-sizing: border-box;
        }
        :host {
          display: block;
          height: 100%;
        }
        .container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #313131;
          color: #eeeeee;
          position: relative;
          --tools-height: 40px;
          --controls-height: 40px;
        }
        .tools {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          height: var(--tools-height);
          border-bottom: 1px solid #202020;
        }
        .tools__item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          margin: 0 8px;
          color: #eeeeee;
        }
        .tools__item div {
          width: 100%;
          cursor: pointer;
        }
        .tools__item div:hover {
          opacity: .6;
        }
        .tools__item svg {
          fill: currentColor;
        }
        .controls {
          display: flex;
          flex-shrink: 0;
          height: var(--controls-height);
          border-bottom: 1px solid #202020;
        }
        .pane {
          display: flex;
          flex: 1;
          overflow: scroll;
          scroll-behavior: smooth;
        }
        .head {
          flex-shrink: 0;
          flex-basis: 20%;
          max-width: 200px;
          min-width: 0;
        }
        .body {
          flex: 1;
          position: relative;
        }
        .actions {
          height: 100%;
          border-right: 1px solid #222322;
        }
        .rows {
          border-right: 1px solid #222322;
        }
        .row {
          display: flex;
          align-items: center;
          height: 24px;
          border-bottom: 1px solid #202020;
          position: relative;
        }
        .row input[type="range"] {
          position: absolute;
          inset: 0;
        }
        .label {
          padding-left: 12px;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
        }
        .bar {
          height: 100%;
          background-color: #545454;
          opacity: .5;
          transform-origin: left;
          cursor: pointer;
          position: relative;
        }
        .bar.bar--debug::before {
          content: "";
          display: block;
          width: 6px;
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          margin: 4px;
          border-radius: 2px;
          background-color: darkgray;
        }
        .bar.bar--debug::after {
          content: "";
          display: block;
          width: 6px;
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          margin: 4px;
          border-radius: 2px;
          background-color: darkgray;
        }
        .bar.bar--active {
          opacity: 1;
        }
        .progress {
          position: absolute;
          top: var(--tools-height);
          bottom: 0;
          left: 0;
          width: 2px;
          margin-left: min(20%, 200px);
          background-color: #71A0EB;
          opacity: 0.6;
        }
        .progress::before {
          content: "";
          display: block;
          width: 20px;
          height: 30px;
          background-color: #53aeff;
          margin-left: -9px;
        }
        .progress::after {
          content: "";
          display: block;
          border-top: 10px solid #53aeff;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          margin-left: -9px;
        }
        .current {
          position: absolute;
          top: var(--tools-height);
          height: var(--controls-height);
          left: -12px;
          right: -12px;
          margin-left: min(20%, 200px);
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
          cursor: pointer;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          opacity: 0;
        }
        input[type="range"]::-moz-range-thumb {
          opacity: 0;
        }
        /* Firefox\u3067\u70B9\u7DDA\u304C\u5468\u308A\u306B\u8868\u793A\u3055\u308C\u3066\u3057\u307E\u3046\u554F\u984C\u306E\u89E3\u6D88 */
        input[type="range"]::-moz-focus-outer {
          border: 0;
        }
        .current input[type="range"] {
          height: var(--controls-height);
          width: 100%;
          background: transparent;
        }
        input.begin[type="range"],
        input.end[type="range"] {
          height: 100%;
          width: calc(100% + 12px);
          background: transparent;
          pointer-events: none;
          margin-left: -6px;
        }
        input.begin[type="range"]::-webkit-slider-thumb,
        input.end[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          opacity: 0;   
          width: 12px;
          height: 100%;
          cursor: ew-resize;
        }
        input.begin[type="range"]::-moz-range-thumb,
        input.end[type="range"]::-moz-range-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          opacity: 0;   
          width: 12px;
          height: 100%;
          cursor: ew-resize;
        }
        input.begin[type="range"]::-webkit-slider-thumb {
          background: darkgreen;
          transform: translateX(50%);
        }
        input.begin[type="range"]::-moz-range-thumb {
          background: darkgreen;
          transform: translateX(50%);
        }
        input.end[type="range"]::-webkit-slider-thumb {
          background: indianred;
          transform: translateX(-50%);
        }
        input.end[type="range"]::-moz-range-thumb {
          background: indianred;
          transform: translateX(-50%);
        }
        .scale {
          position: relative;
          height: 100%;
        }
        .scale-s,
        .scale-100ms {
          height: 50%;
        }
        .scale-s {
          /*
            total / 1s 
            e.g. 6000 / 1000
            x / 1000 = 6
            calc(100% / calc(var(--total) / 1000))
           */
          --x: calc(100% / calc(var(--total) / 1000));
          background: repeating-linear-gradient(90deg, transparent 0, transparent calc(var(--x) - 1px), #202020 calc(var(--x) - 1px), #202020 var(--x));
          border-bottom: 1px solid #202020;
        }
        .scale-100ms {
          --x: calc(100% / calc(var(--total) / 1000) / 10);
          background: repeating-linear-gradient(90deg, transparent 0, transparent calc(var(--x) - 1px), #202020 calc(var(--x) - 1px), #202020 var(--x));
        }
        .scale-label {
          --x: calc(100% / calc(var(--total) / 1000));
          position: absolute;
          top: 0;
          left: calc(var(--x) * var(--sec));
          font-size: 10px;
          font-style: italic;
          transform: translateX(calc(-100% - 4px));
        }
      </style>
      <div class="container">
        <div class="tools">
          <div class="tools__item">
            <div id="previous">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.75 20C2.75 20.5523 3.19772 21 3.75 21C4.30228 21 4.75 20.5523 4.75 20L4.75 4C4.75 3.44772 4.30229 3 3.75 3C3.19772 3 2.75 3.44772 2.75 4V20Z"/>
                <path d="M20.75 19.0526C20.75 20.4774 19.1383 21.305 17.9803 20.4748L7.51062 12.9682C6.50574 12.2477 6.54467 10.7407 7.5854 10.073L18.0551 3.35665C19.2198 2.60946 20.75 3.44583 20.75 4.82961L20.75 19.0526Z"/>
              </svg>
            </div>
          </div>
          <div class="tools__item">
            <div id="play-pause">
              <svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <!-- Generator: Sketch 59.1 (86144) - https://sketch.com -->
                <title>ic_fluent_video_play_pause_24_filled</title>
                <desc>Created with Sketch.</desc>
                <g id="\u{1F50D}-Product-Icons" stroke="none" stroke-width="1" >
                    <g id="ic_fluent_video_play_pause_24_filled" fill-rule="nonzero">
                        <path d="M3.65140982,6.61646219 L11.1528787,11.3693959 C11.3672679,11.5052331 11.4827597,11.722675 11.4993749,11.9464385 L11.4984593,7.25 C11.4984593,6.83578644 11.8342458,6.5 12.2484593,6.5 L15.2484593,6.5 C15.6626729,6.5 15.9984593,6.83578644 15.9984593,7.25 L15.9984593,16.75 C15.9984593,17.1642136 15.6626729,17.5 15.2484593,17.5 L12.2484593,17.5 C11.8342458,17.5 11.4984593,17.1642136 11.4984593,16.75 L11.4993494,12.0597632 C11.4826318,12.2835468 11.3670166,12.5009613 11.1525249,12.6366956 L3.65105604,17.3837618 C3.15168144,17.6997752 2.5,17.3409648 2.5,16.75 L2.5,7.25 C2.5,6.65884683 3.15205264,6.30006928 3.65140982,6.61646219 Z M21.2477085,6.50037474 C21.661922,6.50037474 21.9977085,6.83616118 21.9977085,7.25037474 L21.9977085,16.7496253 C21.9977085,17.1638388 21.661922,17.4996253 21.2477085,17.4996253 L18.2477085,17.4996253 C17.8334949,17.4996253 17.4977085,17.1638388 17.4977085,16.7496253 L17.4977085,7.25037474 C17.4977085,6.83616118 17.8334949,6.50037474 18.2477085,6.50037474 L21.2477085,6.50037474 Z" id="\u{1F3A8}-Color"></path>
                    </g>
                </g>
              </svg>
            </div>
          </div>
          <div class="tools__item">
            <div id="next">
              <svg   viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 4C21 3.44772 20.5523 3 20 3C19.4477 3 19 3.44772 19 4V20C19 20.5523 19.4477 21 20 21C20.5523 21 21 20.5523 21 20V4Z"/>
                <path d="M3 4.94743C3 3.5226 4.61175 2.69498 5.7697 3.52521L16.2394 11.0318C17.2443 11.7523 17.2053 13.2593 16.1646 13.927L5.69492 20.6434C4.53019 21.3905 3 20.5542 3 19.1704V4.94743Z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="controls">
          <div class="head"><div class="actions"></div></div>
          <div class="body">
            <div class="scale" id="scale" style="--total: ${t}">
              <div class="scale-s"></div>
              <div class="scale-100ms"></div>
              ${n}
            </div>
          </div>
        </div>
        <div id="pane" class="pane">
          <div class="head">
            <div class="rows">
              ${a}
            </div>
          </div>
          <div id="timeline" class="body">
            <div class="rows">
              ${e}
            </div>
          </div>
        </div>
        <div class="current">
          <input id="current" type="range" min="0" max="0" step="any" value="0">
        </div>
        <div id="progress" class="progress"></div>
      </div>
    `;
      }
      __updateScale(i) {
        let t = this.shadowRoot.querySelector('.test');
        t && t.remove(),
          this.shadowRoot.querySelectorAll('.scale-label').forEach((s) => {
            s.remove();
          }),
          this.shadowRoot.querySelector('.scale').style.setProperty('--total', i);
        let e = '';
        for (let s = 0, r = Math.floor(i / 1e3); s < r; s++)
          e += `<div class="scale-label" style="--sec: ${s + 1}">${s + 1}s</div>`;
        let n = document.createElement('div');
        (n.className = 'test'), (n.innerHTML = e), this.shadowRoot.querySelector('.scale').appendChild(n);
      }
      __updateProgressPosition(i) {
        let t = this.$timeline.clientWidth,
          a = Math.min(i / this.totalTime, 1) * t;
        this.$progress.style.transform = `translateX(${a}px)`;
      }
      __updateBarRange(i) {
        for (let t = 0; t < this.$bars.length; t++) {
          let a = this.axes[t];
          this.$barsBegin[t].setAttribute('max', i),
            (this.$barsBegin[t].value = a.beginAt),
            this.$barsEnd[t].setAttribute('max', i),
            (this.$barsEnd[t].value = a.endAt);
        }
      }
      __updateBar(i) {
        let a = this.$timeline.clientWidth / i;
        for (let e = 0; e < this.$bars.length; e++) {
          let n = this.axes[e],
            s = n.beginAt * a,
            r = (n.endAt - n.beginAt) * a;
          (this.$bars[e].style.transform = `translateX(${s}px)`),
            (this.$bars[e].style.width = `${r}px`),
            0 < n.progress && !n.pass
              ? this.$bars[e].classList.add('bar--active')
              : this.$bars[e].classList.remove('bar--active');
        }
      }
    };
    window.customElements.define('taxis-timeline', p);
    var u = { key: '', beginAt: 0, endAt: 0, duration: 0, delay: 0, position: 0, progress: 0, enter: !1, pass: !1 };
    var g = class {
      constructor(i = {}) {
        this.option = i;
        this.axes = [];
      }
      get totalTime() {
        return this.axes.length ? Math.max(...this.axes.map((i) => i.endAt)) : 0;
      }
      get totalTimeForTimeline() {
        return this.totalTime + 500;
      }
      get everyPassed() {
        return this.axes.every((i) => i.pass);
      }
      restart() {
        this.beginAt = Date.now();
      }
      getAxis({ key: i }) {
        return this.axes.find((t) => t.key === i);
      }
      getAxes() {
        return this.axes;
      }
      add(i, t, a = 0, e) {
        let n = this.totalTime + a;
        if (e !== void 0) Number.isFinite(e) ? (n = e + a) : (n = this.getAxis({ key: e }).endAt + a);
        else {
          let s = this.axes[this.axes.length - 1];
          e = s ? s.key : 0;
        }
        return (
          this.axes.push({ ...u, key: i, beginAt: n, endAt: n + t, duration: t, delay: a, position: e }), this.sort(), this
        );
      }
      begin() {
        this.option.timeline &&
          ((this.timeline = new p(this.axes, this.totalTimeForTimeline, this.option.timeline.debug)),
          this.option.timeline.container.appendChild(this.timeline)),
          (this.beginAt = Date.now()),
          this.__tick();
      }
      reset() {
        cancelAnimationFrame(this.requestID);
      }
      ticker(i) {
        this.tickerFn = i;
      }
      __tick() {
        let i = this.beginAt,
          t = Date.now() - i,
          a = !1;
        if (this.option.timeline) {
          this.axes = this.recalculation(this.timeline.getAxes());
          let { beginAt: e, elapsedTime: n, editing: s } = this.timeline.get(this.beginAt);
          (i = e), (t = n), (a = s);
        }
        (this.beginAt = i),
          this.axes.forEach((e, n) => {
            let s = t - e.beginAt,
              r = Math.max(0, Math.min(s / e.duration, 1)),
              d = e.beginAt <= t,
              l = e.endAt < t;
            (e.progress = r), (e.enter = d), (e.pass = l);
          }),
          this.option.timeline && !a && this.timeline.update(t, this.totalTimeForTimeline, this.axes),
          this.tickerFn && this.tickerFn(t, this.toMap(this.axes)),
          (this.requestID = requestAnimationFrame(this.__tick.bind(this)));
      }
      calculation() {
        let i = [];
        for (let t = 0; t < this.axes.length; t++) {
          let a = this.axes[t],
            { key: e, duration: n, position: s, delay: r } = a,
            l = Math.max(...i.map((o) => o.endAt)) + r;
          s !== void 0 ? (Number.isFinite(s) ? (l = s + r) : (l = this.getAxis({ key: s }).endAt + r)) : (s = l),
            i.push({ ...u, key: e, beginAt: l, endAt: l + n, duration: n, delay: r, position: s });
        }
      }
      recalculation(i) {
        let t = [];
        for (let a = 0; a < i.length; a++) {
          let e = i[a],
            { key: n, duration: s, position: r, delay: d } = e,
            o = Math.max(...t.map((h) => h.endAt)) + d;
          r !== void 0 ? (Number.isFinite(r) ? (o = r + d) : (o = this.getAxis({ key: r }).endAt + d)) : (r = o),
            t.push({ ...u, key: n, beginAt: o, endAt: o + s, duration: s, delay: d, position: r });
        }
        return t;
      }
      sort() {
        this.axes.sort((i, t) => i.beginAt - t.beginAt);
      }
      toMap(i) {
        let t = new Map();
        return (
          i.forEach((a) => {
            (t[a.key] = a), t.set(a.key, a);
          }),
          t
        );
      }
    };

    /**
     * Common utilities
     * @module glMatrix
     */
    // Configuration Constants
    var EPSILON = 0.000001;
    var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
    if (!Math.hypot) Math.hypot = function () {
      var y = 0,
          i = arguments.length;

      while (i--) {
        y += arguments[i] * arguments[i];
      }

      return Math.sqrt(y);
    };

    /**
     * 3x3 Matrix
     * @module mat3
     */

    /**
     * Creates a new identity mat3
     *
     * @returns {mat3} a new 3x3 matrix
     */

    function create$4() {
      var out = new ARRAY_TYPE(9);

      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
      }

      out[0] = 1;
      out[4] = 1;
      out[8] = 1;
      return out;
    }

    /**
     * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
     * @module mat4
     */

    /**
     * Creates a new identity mat4
     *
     * @returns {mat4} a new 4x4 matrix
     */

    function create$3() {
      var out = new ARRAY_TYPE(16);

      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
      }

      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      return out;
    }
    /**
     * Inverts a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function invert(out, a) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];
      var b00 = a00 * a11 - a01 * a10;
      var b01 = a00 * a12 - a02 * a10;
      var b02 = a00 * a13 - a03 * a10;
      var b03 = a01 * a12 - a02 * a11;
      var b04 = a01 * a13 - a03 * a11;
      var b05 = a02 * a13 - a03 * a12;
      var b06 = a20 * a31 - a21 * a30;
      var b07 = a20 * a32 - a22 * a30;
      var b08 = a20 * a33 - a23 * a30;
      var b09 = a21 * a32 - a22 * a31;
      var b10 = a21 * a33 - a23 * a31;
      var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

      var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

      if (!det) {
        return null;
      }

      det = 1.0 / det;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return out;
    }
    /**
     * Multiplies two mat4s
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the first operand
     * @param {ReadonlyMat4} b the second operand
     * @returns {mat4} out
     */

    function multiply$1(out, a, b) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15]; // Cache only the current line of the second matrix

      var b0 = b[0],
          b1 = b[1],
          b2 = b[2],
          b3 = b[3];
      out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[4];
      b1 = b[5];
      b2 = b[6];
      b3 = b[7];
      out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[8];
      b1 = b[9];
      b2 = b[10];
      b3 = b[11];
      out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[12];
      b1 = b[13];
      b2 = b[14];
      b3 = b[15];
      out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      return out;
    }
    /**
     * Translate a mat4 by the given vector
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to translate
     * @param {ReadonlyVec3} v vector to translate by
     * @returns {mat4} out
     */

    function translate(out, a, v) {
      var x = v[0],
          y = v[1],
          z = v[2];
      var a00, a01, a02, a03;
      var a10, a11, a12, a13;
      var a20, a21, a22, a23;

      if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      } else {
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a10 = a[4];
        a11 = a[5];
        a12 = a[6];
        a13 = a[7];
        a20 = a[8];
        a21 = a[9];
        a22 = a[10];
        a23 = a[11];
        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a03;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a20;
        out[9] = a21;
        out[10] = a22;
        out[11] = a23;
        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
      }

      return out;
    }
    /**
     * Generates a perspective projection matrix with the given bounds.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {number} fovy Vertical field of view in radians
     * @param {number} aspect Aspect ratio. typically viewport width/height
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum, can be null or Infinity
     * @returns {mat4} out
     */

    function perspective(out, fovy, aspect, near, far) {
      var f = 1.0 / Math.tan(fovy / 2),
          nf;
      out[0] = f / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;

      if (far != null && far !== Infinity) {
        nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = 2 * far * near * nf;
      } else {
        out[10] = -1;
        out[14] = -2 * near;
      }

      return out;
    }
    /**
     * Generates a matrix that makes something look at something else.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {ReadonlyVec3} eye Position of the viewer
     * @param {ReadonlyVec3} center Point the viewer is looking at
     * @param {ReadonlyVec3} up vec3 pointing up
     * @returns {mat4} out
     */

    function targetTo(out, eye, target, up) {
      var eyex = eye[0],
          eyey = eye[1],
          eyez = eye[2],
          upx = up[0],
          upy = up[1],
          upz = up[2];
      var z0 = eyex - target[0],
          z1 = eyey - target[1],
          z2 = eyez - target[2];
      var len = z0 * z0 + z1 * z1 + z2 * z2;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
        z0 *= len;
        z1 *= len;
        z2 *= len;
      }

      var x0 = upy * z2 - upz * z1,
          x1 = upz * z0 - upx * z2,
          x2 = upx * z1 - upy * z0;
      len = x0 * x0 + x1 * x1 + x2 * x2;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
        x0 *= len;
        x1 *= len;
        x2 *= len;
      }

      out[0] = x0;
      out[1] = x1;
      out[2] = x2;
      out[3] = 0;
      out[4] = z1 * x2 - z2 * x1;
      out[5] = z2 * x0 - z0 * x2;
      out[6] = z0 * x1 - z1 * x0;
      out[7] = 0;
      out[8] = z0;
      out[9] = z1;
      out[10] = z2;
      out[11] = 0;
      out[12] = eyex;
      out[13] = eyey;
      out[14] = eyez;
      out[15] = 1;
      return out;
    }

    /**
     * 3 Dimensional Vector
     * @module vec3
     */

    /**
     * Creates a new, empty vec3
     *
     * @returns {vec3} a new 3D vector
     */

    function create$2() {
      var out = new ARRAY_TYPE(3);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
      }

      return out;
    }
    /**
     * Calculates the length of a vec3
     *
     * @param {ReadonlyVec3} a vector to calculate length of
     * @returns {Number} length of a
     */

    function length(a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      return Math.hypot(x, y, z);
    }
    /**
     * Creates a new vec3 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} a new 3D vector
     */

    function fromValues(x, y, z) {
      var out = new ARRAY_TYPE(3);
      out[0] = x;
      out[1] = y;
      out[2] = z;
      return out;
    }
    /**
     * Scales a vec3 by a scalar number
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec3} out
     */

    function scale(out, a, b) {
      out[0] = a[0] * b;
      out[1] = a[1] * b;
      out[2] = a[2] * b;
      return out;
    }
    /**
     * Normalize a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to normalize
     * @returns {vec3} out
     */

    function normalize$2(out, a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var len = x * x + y * y + z * z;

      if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
      }

      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
      return out;
    }
    /**
     * Calculates the dot product of two vec3's
     *
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {Number} dot product of a and b
     */

    function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    /**
     * Computes the cross product of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function cross(out, a, b) {
      var ax = a[0],
          ay = a[1],
          az = a[2];
      var bx = b[0],
          by = b[1],
          bz = b[2];
      out[0] = ay * bz - az * by;
      out[1] = az * bx - ax * bz;
      out[2] = ax * by - ay * bx;
      return out;
    }
    /**
     * Transforms the vec3 with a quat
     * Can also be used for dual quaternions. (Multiply it with the real part)
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the vector to transform
     * @param {ReadonlyQuat} q quaternion to transform with
     * @returns {vec3} out
     */

    function transformQuat(out, a, q) {
      // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
      var qx = q[0],
          qy = q[1],
          qz = q[2],
          qw = q[3];
      var x = a[0],
          y = a[1],
          z = a[2]; // var qvec = [qx, qy, qz];
      // var uv = vec3.cross([], qvec, a);

      var uvx = qy * z - qz * y,
          uvy = qz * x - qx * z,
          uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

      var uuvx = qy * uvz - qz * uvy,
          uuvy = qz * uvx - qx * uvz,
          uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

      var w2 = qw * 2;
      uvx *= w2;
      uvy *= w2;
      uvz *= w2; // vec3.scale(uuv, uuv, 2);

      uuvx *= 2;
      uuvy *= 2;
      uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

      out[0] = x + uvx + uuvx;
      out[1] = y + uvy + uuvy;
      out[2] = z + uvz + uuvz;
      return out;
    }
    /**
     * Alias for {@link vec3.length}
     * @function
     */

    var len = length;
    /**
     * Perform some operation over an array of vec3s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    (function () {
      var vec = create$2();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 3;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          vec[2] = a[i + 2];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
          a[i + 2] = vec[2];
        }

        return a;
      };
    })();

    /**
     * 4 Dimensional Vector
     * @module vec4
     */

    /**
     * Creates a new, empty vec4
     *
     * @returns {vec4} a new 4D vector
     */

    function create$1() {
      var out = new ARRAY_TYPE(4);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
      }

      return out;
    }
    /**
     * Normalize a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {ReadonlyVec4} a vector to normalize
     * @returns {vec4} out
     */

    function normalize$1(out, a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var w = a[3];
      var len = x * x + y * y + z * z + w * w;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
      }

      out[0] = x * len;
      out[1] = y * len;
      out[2] = z * len;
      out[3] = w * len;
      return out;
    }
    /**
     * Perform some operation over an array of vec4s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    (function () {
      var vec = create$1();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 4;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          vec[2] = a[i + 2];
          vec[3] = a[i + 3];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
          a[i + 2] = vec[2];
          a[i + 3] = vec[3];
        }

        return a;
      };
    })();

    /**
     * Quaternion
     * @module quat
     */

    /**
     * Creates a new identity quat
     *
     * @returns {quat} a new quaternion
     */

    function create() {
      var out = new ARRAY_TYPE(4);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
      }

      out[3] = 1;
      return out;
    }
    /**
     * Set a quat to the identity quaternion
     *
     * @param {quat} out the receiving quaternion
     * @returns {quat} out
     */

    function identity(out) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    }
    /**
     * Sets a quat from the given angle and rotation axis,
     * then returns it.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyVec3} axis the axis around which to rotate
     * @param {Number} rad the angle in radians
     * @returns {quat} out
     **/

    function setAxisAngle(out, axis, rad) {
      rad = rad * 0.5;
      var s = Math.sin(rad);
      out[0] = s * axis[0];
      out[1] = s * axis[1];
      out[2] = s * axis[2];
      out[3] = Math.cos(rad);
      return out;
    }
    /**
     * Multiplies two quat's
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @returns {quat} out
     */

    function multiply(out, a, b) {
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var bx = b[0],
          by = b[1],
          bz = b[2],
          bw = b[3];
      out[0] = ax * bw + aw * bx + ay * bz - az * by;
      out[1] = ay * bw + aw * by + az * bx - ax * bz;
      out[2] = az * bw + aw * bz + ax * by - ay * bx;
      out[3] = aw * bw - ax * bx - ay * by - az * bz;
      return out;
    }
    /**
     * Performs a spherical linear interpolation between two quat
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {quat} out
     */

    function slerp(out, a, b, t) {
      // benchmarks:
      //    http://jsperf.com/quaternion-slerp-implementations
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var bx = b[0],
          by = b[1],
          bz = b[2],
          bw = b[3];
      var omega, cosom, sinom, scale0, scale1; // calc cosine

      cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

      if (cosom < 0.0) {
        cosom = -cosom;
        bx = -bx;
        by = -by;
        bz = -bz;
        bw = -bw;
      } // calculate coefficients


      if (1.0 - cosom > EPSILON) {
        // standard case (slerp)
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
      } else {
        // "from" and "to" quaternions are very close
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
      } // calculate final values


      out[0] = scale0 * ax + scale1 * bx;
      out[1] = scale0 * ay + scale1 * by;
      out[2] = scale0 * az + scale1 * bz;
      out[3] = scale0 * aw + scale1 * bw;
      return out;
    }
    /**
     * Creates a quaternion from the given 3x3 rotation matrix.
     *
     * NOTE: The resultant quaternion is not normalized, so you should be sure
     * to renormalize the quaternion yourself where necessary.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyMat3} m rotation matrix
     * @returns {quat} out
     * @function
     */

    function fromMat3(out, m) {
      // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
      // article "Quaternion Calculus and Fast Animation".
      var fTrace = m[0] + m[4] + m[8];
      var fRoot;

      if (fTrace > 0.0) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0); // 2w

        out[3] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot; // 1/(4w)

        out[0] = (m[5] - m[7]) * fRoot;
        out[1] = (m[6] - m[2]) * fRoot;
        out[2] = (m[1] - m[3]) * fRoot;
      } else {
        // |w| <= 1/2
        var i = 0;
        if (m[4] > m[0]) i = 1;
        if (m[8] > m[i * 3 + i]) i = 2;
        var j = (i + 1) % 3;
        var k = (i + 2) % 3;
        fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
        out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
        out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
      }

      return out;
    }
    /**
     * Normalize a quat
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quaternion to normalize
     * @returns {quat} out
     * @function
     */

    var normalize = normalize$1;
    /**
     * Sets a quaternion to represent the shortest rotation from one
     * vector to another.
     *
     * Both vectors are assumed to be unit length.
     *
     * @param {quat} out the receiving quaternion.
     * @param {ReadonlyVec3} a the initial vector
     * @param {ReadonlyVec3} b the destination vector
     * @returns {quat} out
     */

    (function () {
      var tmpvec3 = create$2();
      var xUnitVec3 = fromValues(1, 0, 0);
      var yUnitVec3 = fromValues(0, 1, 0);
      return function (out, a, b) {
        var dot$1 = dot(a, b);

        if (dot$1 < -0.999999) {
          cross(tmpvec3, xUnitVec3, a);
          if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
          normalize$2(tmpvec3, tmpvec3);
          setAxisAngle(out, tmpvec3, Math.PI);
          return out;
        } else if (dot$1 > 0.999999) {
          out[0] = 0;
          out[1] = 0;
          out[2] = 0;
          out[3] = 1;
          return out;
        } else {
          cross(tmpvec3, a, b);
          out[0] = tmpvec3[0];
          out[1] = tmpvec3[1];
          out[2] = tmpvec3[2];
          out[3] = 1 + dot$1;
          return normalize(out, out);
        }
      };
    })();
    /**
     * Performs a spherical linear interpolation with two control points
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @param {ReadonlyQuat} c the third operand
     * @param {ReadonlyQuat} d the fourth operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {quat} out
     */

    (function () {
      var temp1 = create();
      var temp2 = create();
      return function (out, a, b, c, d, t) {
        slerp(temp1, a, d, t);
        slerp(temp2, b, c, t);
        slerp(out, temp1, temp2, 2 * t * (1 - t));
        return out;
      };
    })();
    /**
     * Sets the specified quaternion with values corresponding to the given
     * axes. Each axis is a vec3 and is expected to be unit length and
     * perpendicular to all other specified axes.
     *
     * @param {ReadonlyVec3} view  the vector representing the viewing direction
     * @param {ReadonlyVec3} right the vector representing the local "right" direction
     * @param {ReadonlyVec3} up    the vector representing the local "up" direction
     * @returns {quat} out
     */

    (function () {
      var matr = create$4();
      return function (out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];
        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];
        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];
        return normalize(out, fromMat3(out, matr));
      };
    })();

    const createProgram = (gl, vertexShader, fragmentShader) => {
        const program = gl.createProgram();
        if (!program) {
            throw new Error(`Failed to create program`);
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Failed to link: ${gl.getProgramInfoLog(program)}`);
        }
        gl.useProgram(program);
        return program;
    };
    const createShaderObject = (gl, source, type) => {
        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error(`Failed to create shader`);
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Failed to compile: ${gl.getShaderInfoLog(shader)}`);
        }
        return shader;
    };
    const createVBO = (gl, vertexArray) => {
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    };
    const createIBO = (gl, index) => {
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    };
    const enableAttribute = (gl, vbo, attribLocation, attribStride) => {
        vbo.forEach((buffer, i) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(attribLocation[i]);
            gl.vertexAttribPointer(attribLocation[i], attribStride[i], gl.FLOAT, false, 0, 0);
        });
    };
    const createTexture = (gl, source, unit) => {
        const texture = gl.createTexture();
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // WARNING: Image loading must be complete.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    };

    // TODO: scaleの挙動がなんか変
    // TODO: オプション
    // TODO: 移動系のメソッド
    class Camera {
        constructor(container, option) {
            this.container = container;
            this.option = option;
            this.isMovable = true;
            this.isScalable = true;
            this.__distance = 10.0;
            this.scale = 0.0;
            this.rotateX = 0.0;
            this.rotateY = 0.0;
            this.qt = create();
            this.qtx = create();
            this.qty = create();
            // TODO: オプションでもらえるように
            this.center = [0.0, 0.0, 0.0];
            this.__position = [0.0, 7.0, this.__distance];
            this.defaultPosition = [0.0, 7.0, this.__distance];
            this.defaultUpDirection = [0.0, 1.0, 0.0];
            this.upDirection = [0.0, 1.0, 0.0];
            this.minDistance = 1.0;
            this.maxDistance = 20.0;
            this.handleMousedown = this.handleMousedown.bind(this);
            this.handleMousemove = this.handleMousemove.bind(this);
            this.handleMouseup = this.handleMouseup.bind(this);
            this.handleWheel = this.handleWheel.bind(this);
            // TODO: option
            if (this.option && 'isMovable' in this.option) {
                this.isMovable = this.option.isMovable;
            }
            if (this.option && 'isScalable' in this.option) {
                this.isScalable = this.option.isScalable;
            }
            if (this.option && this.option.center) {
                this.center = this.option.center;
            }
            if (this.option && this.option.minDistance) {
                this.minDistance = this.option.minDistance;
            }
            if (this.option && this.option.maxDistance) {
                this.maxDistance = this.option.maxDistance;
            }
            // TODO: position
            if (this.option && this.option.position) {
                const v = create$2();
                const n = create$2();
                normalize$2(n, this.option.position.direction);
                scale(v, n, this.option.position.distance);
                this.__position = [...v];
                this.defaultPosition = [...v];
                // private position = [0.0, 7.0, this.distance];
                // private defaultPosition = [0.0, 7.0, this.distance];
                //
                // private defaultUpDirection = [0.0, 1.0, 0.0];
                // private upDirection = [0.0, 1.0, 0.0];
            }
            this.addEvent();
        }
        get position() {
            return this.__position;
        }
        get distance() {
            return this.__distance;
        }
        set distance(value) {
            this.__distance = value;
        }
        addEvent() {
            if (this.isMovable) {
                this.container.addEventListener('mousedown', this.handleMousedown, { passive: true });
                this.container.addEventListener('mousemove', this.handleMousemove, { passive: true });
                this.container.addEventListener('mouseup', this.handleMouseup, { passive: true });
            }
            if (this.isScalable) {
                this.container.addEventListener('wheel', this.handleWheel, { passive: true });
            }
        }
        removeEvent() {
            if (this.isMovable) {
                this.container.removeEventListener('mousedown', this.handleMousedown);
                this.container.removeEventListener('mousemove', this.handleMousemove);
                this.container.removeEventListener('mouseup', this.handleMouseup);
            }
            if (this.isScalable) {
                this.container.removeEventListener('wheel', this.handleWheel);
            }
        }
        handleMousedown(e) {
            this.drag = true;
            const rect = this.container.getBoundingClientRect();
            this.prevPosition = [e.clientX - rect.left, e.clientY - rect.top];
        }
        handleMousemove(e) {
            if (this.drag !== true) {
                return;
            }
            if (e.buttons !== 1) {
                return;
            }
            const rect = this.container.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            // サイズの小さい辺を基準に計算する
            const s = 1.0 / Math.min(w, h);
            const x = e.clientX;
            const y = e.clientY;
            this.rotateX += (this.prevPosition[0] - x) * s;
            this.rotateY += (this.prevPosition[1] - y) * s;
            this.rotateX = this.rotateX % 1.0;
            // // -0.25 ~ 0.25 ???
            // this.rotateY = Math.min(Math.max(this.rotateY % 1.0, -0.25), 0.25);
            this.prevPosition = [x, y];
        }
        handleMouseup() {
            this.drag = false;
        }
        handleWheel(e) {
            const w = e.wheelDelta;
            if (w > 0) {
                this.scale = -0.5;
            }
            else if (w < 0) {
                this.scale = 0.5;
            }
        }
        update() {
            const PI2 = Math.PI * 2.0;
            const v = [1.0, 0.0, 0.0];
            // rotate
            identity(this.qt);
            identity(this.qtx);
            identity(this.qty);
            setAxisAngle(this.qtx, [0.0, 1.0, 0.0], this.rotateX * PI2);
            transformQuat(v, v, this.qtx);
            setAxisAngle(this.qty, v, this.rotateY * PI2);
            multiply(this.qt, this.qty, this.qtx);
            transformQuat(this.__position, this.defaultPosition, this.qt);
            transformQuat(this.upDirection, this.defaultUpDirection, this.qt);
            // scale
            this.scale *= 0.7;
            this.__distance += this.scale;
            this.__distance = Math.min(Math.max(this.__distance, this.minDistance), this.maxDistance);
            const d = create$2();
            normalize$2(d, this.__position);
            scale(this.__position, d, this.__distance);
            return targetTo(create$3(), this.__position, this.center, this.upDirection);
        }
    }

    const axis = (size, color) => {
        // prettier-ignore
        const pos = [
            // X
            size * -1, 0.0, 0.0,
            size, 0.0, 0.0,
            // Y
            0.0, size * -1, 0.0,
            0.0, size, 0.0,
            // Z
            0.0, 0.0, size,
            0.0, 0.0, size * -1,
        ];
        // prettier-ignore
        const col = color ? [
            ...color,
            ...color,
            ...color,
            ...color,
            ...color,
            ...color,
        ] : [
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
        ];
        return { position: pos, color: col };
    };
    const plane = (width, height, color) => {
        const w = width / 2;
        const h = height / 2;
        // prettier-ignore
        let pos = [
            -w, h, 0.0,
            w, h, 0.0,
            -w, -h, 0.0,
            w, -h, 0.0
        ];
        // prettier-ignore
        let nor = [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ];
        // prettier-ignore
        let col = [
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3]
        ];
        // prettier-ignore
        let st = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
        // prettier-ignore
        let idx = [
            0, 2, 1,
            1, 2, 3
        ];
        return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
    };
    const box = (width, height, depth, color) => {
        let hw = width * 0.5;
        let hh = height * 0.5;
        let hd = depth * 0.5;
        // prettier-ignore
        let pos = [
            -hw, -hh, hd,
            hw, -hh, hd,
            hw, hh, hd,
            -hw, hh, hd,
            -hw, -hh, -hd,
            -hw, hh, -hd,
            hw, hh, -hd,
            hw, -hh, -hd,
            -hw, hh, -hd,
            -hw, hh, hd,
            hw, hh, hd,
            hw, hh, -hd,
            -hw, -hh, -hd,
            hw, -hh, -hd,
            hw, -hh, hd,
            -hw, -hh, hd,
            hw, -hh, -hd,
            hw, hh, -hd,
            hw, hh, hd,
            hw, -hh, hd,
            -hw, -hh, -hd,
            -hw, -hh, hd,
            -hw, hh, hd,
            -hw, hh, -hd // 左上奥
        ];
        let v = 1.0 / Math.sqrt(3.0);
        // prettier-ignore
        let nor = [
            -v, -v, v, v, -v, v, v, v, v, -v, v, v,
            -v, -v, -v, -v, v, -v, v, v, -v, v, -v, -v,
            -v, v, -v, -v, v, v, v, v, v, v, v, -v,
            -v, -v, -v, v, -v, -v, v, -v, v, -v, -v, v,
            v, -v, -v, v, v, -v, v, v, v, v, -v, v,
            -v, -v, -v, -v, -v, v, -v, v, v, -v, v, -v
        ];
        let col = [];
        for (let i = 0; i < pos.length / 3; i++) {
            col.push(color[0], color[1], color[2], color[3]);
        }
        // prettier-ignore
        let st = [
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
        ];
        // prettier-ignore
        let idx = [
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
        ];
        return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
    };
    // TODO: 命名変更
    const boxLine = (width, height, depth, color) => {
        let hw = width * 0.5;
        let hh = height * 0.5;
        let hd = depth * 0.5;
        // prettier-ignore
        let pos = [
            // 前面
            -hw, -hh, hd,
            hw, -hh, hd,
            hw, -hh, hd,
            hw, hh, hd,
            hw, hh, hd,
            -hw, hh, hd,
            -hw, hh, hd,
            -hw, -hh, hd,
            // 奥面
            -hw, -hh, -hd,
            -hw, hh, -hd,
            -hw, hh, -hd,
            hw, hh, -hd,
            hw, hh, -hd,
            hw, -hh, -hd,
            hw, -hh, -hd,
            -hw, -hh, -hd,
            // 天井
            -hw, hh, -hd,
            -hw, hh, hd,
            -hw, hh, hd,
            hw, hh, hd,
            hw, hh, hd,
            hw, hh, -hd,
            hw, hh, -hd,
            -hw, hh, -hd,
            // 下面
            -hw, -hh, -hd,
            hw, -hh, -hd,
            hw, -hh, -hd,
            hw, -hh, hd,
            hw, -hh, hd,
            -hw, -hh, hd,
            -hw, -hh, hd,
            -hw, -hh, -hd,
            // 右面
            hw, -hh, -hd,
            hw, hh, -hd,
            hw, hh, -hd,
            hw, hh, hd,
            hw, hh, hd,
            hw, -hh, hd,
            hw, -hh, hd,
            hw, -hh, -hd,
            // 左面
            -hw, -hh, -hd,
            -hw, -hh, hd,
            -hw, -hh, hd,
            -hw, hh, hd,
            -hw, hh, hd,
            -hw, hh, -hd // 左上奥
            // -hw,  hh, -hd // 左上奥
            // -hw, -hh, -hd, // 左下奥
        ];
        let col = [];
        for (let i = 0; i < pos.length / 3; i++) {
            col.push(color[0], color[1], color[2], color[3]);
        }
        return { position: pos, color: col };
    };

    const stride = (type) => {
        if (type === 'bool') {
            return 1;
        }
        return Number(type[type.length - 1]);
    };
    const parseVariables = ({ vertex, fragment }) => {
        const attribute = [];
        const uniform = [];
        const uniLocation = {};
        // 変数宣言部分を抽出する正規表現
        const attributeReg = /attribute (?<type>.*) (?<variable>.*);/;
        const uniformReg = /uniform (?<type>.*) (?<variable>.*);/;
        // vertexShader
        vertex.split('\n').forEach((row) => {
            const foundAttribute = row.match(attributeReg);
            if (!!foundAttribute) {
                const { variable, type } = foundAttribute.groups;
                attribute.push({
                    variable,
                    type,
                    attStride: stride(type),
                });
            }
            const foundUniform = row.match(uniformReg);
            if (!!foundUniform) {
                const { variable, type } = foundUniform.groups;
                uniform.push({
                    variable,
                    type,
                });
                uniLocation[variable] = null;
            }
        });
        // fragmentShader
        fragment.split('\n').forEach((row) => {
            const foundUniform = row.match(uniformReg);
            if (!!foundUniform) {
                const { variable, type } = foundUniform.groups;
                uniform.push({
                    variable,
                    type,
                });
                uniLocation[variable] = null;
            }
        });
        return {
            attribute,
            uniform,
            uniLocation,
        };
    };

    var fragment = "precision mediump float;\n\nuniform sampler2D textureUnit;\nuniform bool isTexture;\n\nvarying vec4 vColor;\nvarying vec2 vTexCoord;\n\nvoid main(){\n    vec4 samplerColor = vec4(1.0);\n    if(isTexture == true){\n        samplerColor = texture2D(textureUnit, vTexCoord);\n        gl_FragColor = samplerColor;\n    } else {\n        gl_FragColor = vColor;\n    }\n}\n\n";

    var vertex = "attribute vec3 position;\nattribute vec4 color;\nattribute vec2 texCoord;\n\nuniform mat4 mvpMatrix;\n\nvarying vec4 vColor;\nvarying vec2 vTexCoord;\n\n\nvoid main(){\n    vColor = color;\n\n    vTexCoord = texCoord;\n\n    gl_Position = mvpMatrix * vec4(position, 1.0);\n}\n\n";

    var subFragment = "precision mediump float;\nvarying vec4 vColor;\n\nvoid main(){\n    gl_FragColor = vColor;\n}\n\n";

    var subVertex = "attribute vec3 fromPosition;\nattribute vec3 toPosition;\nattribute vec4 color;\n\nuniform mat4 mMatrix;   // モデル座標変換\nuniform mat4 mvpMatrix;\nuniform float interporation;\nuniform vec3 eyePosition;   // カメラの位置\n\nvarying vec4 vColor;\n\n\nvoid main(){\n\n\n    vec3 position = mix(fromPosition, toPosition, interporation);\n\n    vColor = color;\n\n    gl_Position = mvpMatrix * vec4(position, 1.0);\n\n//    // ワールド空間（モデル座標変換後の空間）上の頂点の位置\n//    vec4 worldPosition = mMatrix * vec4(position, 1.0);\n//    // カメラからの距離\n//    float dist = length(worldPosition.xyz - eyePosition);\n\n    gl_PointSize = mix(1.0, 12.0 / gl_Position.w, interporation);\n}\n\n";

    const { attribute, uniform, uniLocation } = parseVariables({ vertex, fragment });
    const { attribute: subAttribute, uniform: subUniform, uniLocation: subUniLocation } = parseVariables({
        vertex: subVertex,
        fragment: subFragment,
    });

    const initialState = {
        bucketsCount: 8,
    };
    function createSettings() {
        const { subscribe, set, update } = writable(initialState);
        return {
            subscribe,
            reset: () => set(initialState),
            set: (val) => set(val),
        };
    }
    const settings = createSettings();

    const CANVAS_SIZE = 128;
    const DISPLAY_TEXTURE_SIZE = 1.0;
    const HALF_DISPLAY_TEXTURE_SIZE = DISPLAY_TEXTURE_SIZE / 2;
    const CAMARA_DISTANCE = 7.5;
    let BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
    let AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
    let BOXES_POSITION = [0.0, 0.0, 0.0];
    // TODO: 検討
    let currentBucket = 0;
    let paintedBucket = -1;
    let imageData = null;
    let medianCut;
    let reduceImageData;
    let bucketsPerStep;
    let beforeTexture;
    class Scene {
        constructor() {
            this.programMain = null;
            this.programSub = null;
            this.pMatrix = create$3();
            this.vMatrix = create$3();
            this.vpMatrix = create$3();
            this.attLocation = [];
            this.attStride = [];
            this.uniLocation = uniLocation;
            this.attLocationSub = [];
            this.attStrideSub = [];
            this.uniLocationSub = subUniLocation;
            // model系
            // 減色前のテクスチャ
            this.beforeImage = {
                geometry: null,
                VBO: [],
                IBO: [],
            };
            // 減色後のテクスチャ
            this.afterImage = {
                geometry: null,
                VBO: [],
                IBO: [],
            };
            // buckets
            this.boxes = [];
            this.boxesPosition = [];
            this.boxesVBO = [];
            this.boxesIBO = [];
            this.boxesLine = [];
            this.boxesLineVBO = [];
            // points
            this.pointsFromPosition = [];
            this.pointsToPosition = [];
            this.pointsColor = [];
            this.pointsVBO = [];
            this.afterPointsFromPosition = [];
            this.afterPointsToPosition = [];
            this.afterPointsColor = [];
            this.afterPointsVBO = [];
        }
        init(canvas, timeline) {
            // Taxisの設定
            this.taxis = new g({
                timeline: {
                    container: timeline,
                    debug: false,
                },
            });
            this.taxis.add('Sampling', 3 * 1000);
            for (let i = 0; i < get_store_value(settings).bucketsCount; i++) {
                if (i === 0) {
                    this.taxis.add(`split#${i}`, 0.5 * 1000, 500);
                }
                else {
                    this.taxis.add(`split#${i}`, 0.5 * 1000);
                }
            }
            for (let i = 0; i < get_store_value(settings).bucketsCount; i++) {
                this.taxis.add(`Average color#${i}`, 0.5 * 1000);
            }
            this.taxis.add('Mapping', 3 * 1000, 500);
            this.canvas = canvas;
            this.gl = canvas.getContext(`webgl`);
            this.camera = new Camera(canvas, {
                position: {
                    direction: [0.0, 0.0, 1.0],
                    distance: CAMARA_DISTANCE,
                },
            });
            // 画像の減色
            {
                const image = get_store_value(app$1).file;
                const canvas = document.createElement('canvas');
                canvas.width = CANVAS_SIZE;
                canvas.height = CANVAS_SIZE;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                // 圧縮処理のbucketsを取得
                medianCut = new e(imageData, { strict: true });
                reduceImageData = medianCut.reduce(get_store_value(settings).bucketsCount);
                bucketsPerStep = medianCut.bucketsPerStep;
                beforeTexture = createTexture(this.gl, image, this.gl.TEXTURE0);
                createTexture(this.gl, reduceImageData, this.gl.TEXTURE1);
            }
            // resize
            this.addResizeEvent();
            this.resizeCanvas();
            // programオブジェクトの設定
            this.programMain = this.setupProgram(vertex, fragment);
            this.programSub = this.setupProgram(subVertex, subFragment);
            this.gl.useProgram(this.programMain);
            this.setupBeforeTexture();
            this.setupAfterTexture();
            this.setupPointGeometry();
            this.setupAfterPointGeometry();
            this.setupBoxesGeometry();
            this.setupAxisGeometry();
            this.setupLocation();
            this.setupLocationSub();
            this.render();
        }
        /**
         * Stop ticker
         */
        destroy() {
            this.taxis.reset();
        }
        setupProgram(v, f) {
            const mainVs = createShaderObject(this.gl, v, this.gl.VERTEX_SHADER);
            const mainFs = createShaderObject(this.gl, f, this.gl.FRAGMENT_SHADER);
            return createProgram(this.gl, mainVs, mainFs);
        }
        addResizeEvent() {
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas.bind(this), { passive: true });
        }
        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            // TODO: mobile
            if (window.innerWidth < window.innerHeight) {
                this.camera.distance = (1000 / window.innerHeight) * CAMARA_DISTANCE;
                BEFORE_TEXTURE_POSITION = [0.0, 1.5, 0.0];
                AFTER_TEXTURE_POSITION = [0.0, -1.5, 0.0];
                BOXES_POSITION = [0.0, 0.0, 0.0];
            }
            else {
                this.camera.distance = (900 / window.innerWidth) * CAMARA_DISTANCE;
                BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
                AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
                BOXES_POSITION = [0.0, 0.0, 0.0];
            }
        }
        setupLocation() {
            attribute.forEach((v, i) => {
                this.attLocation[i] = this.gl.getAttribLocation(this.programMain, v.variable);
                this.attStride[i] = v.attStride;
            });
            Object.keys(this.uniLocation).forEach((uniform) => {
                this.uniLocation[uniform] = this.gl.getUniformLocation(this.programMain, uniform);
            });
        }
        setupLocationSub() {
            subAttribute.forEach((v, i) => {
                this.attLocationSub[i] = this.gl.getAttribLocation(this.programSub, v.variable);
                this.attStrideSub[i] = v.attStride;
            });
            Object.keys(this.uniLocationSub).forEach((uniform) => {
                this.uniLocationSub[uniform] = this.gl.getUniformLocation(this.programSub, uniform);
            });
        }
        setupRendering() {
            // clear処理
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.gl.clearColor(0.1, 0.12, 0.14, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            // 震度テストを有効に
            this.gl.enable(this.gl.DEPTH_TEST);
            // 裏面も表示
            this.gl.disable(this.gl.CULL_FACE);
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE); // アルファブレンディング
            invert(this.vMatrix, this.camera.update());
            perspective(this.pMatrix, 45, this.canvas.width / this.canvas.height, 0.1, 20.0);
            multiply$1(this.vpMatrix, this.pMatrix, this.vMatrix);
        }
        setupBeforeTexture() {
            this.beforeImage.geometry = plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0);
            this.beforeImage.VBO = [
                createVBO(this.gl, this.beforeImage.geometry.position),
                createVBO(this.gl, this.beforeImage.geometry.color),
                createVBO(this.gl, this.beforeImage.geometry.texCoord),
            ];
            // インデックスバッファを生成
            this.beforeImage.IBO = createIBO(this.gl, this.beforeImage.geometry.index);
        }
        setupAfterTexture() {
            this.afterImage.geometry = plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0);
            this.afterImage.VBO = [
                createVBO(this.gl, this.afterImage.geometry.position),
                createVBO(this.gl, this.afterImage.geometry.color),
                createVBO(this.gl, this.afterImage.geometry.texCoord),
            ];
            // インデックスバッファを生成
            this.afterImage.IBO = createIBO(this.gl, this.afterImage.geometry.index);
        }
        setupPointGeometry() {
            const len = imageData.data.length / 4;
            for (let i = 0; i < len; i++) {
                const r = imageData.data[i * 4];
                const g = imageData.data[i * 4 + 1];
                const b = imageData.data[i * 4 + 2];
                const a = imageData.data[i * 4 + 3];
                // 画像のst座標的なもの
                const index = i;
                const x = index % imageData.width;
                const y = Math.floor(index / imageData.width);
                this.pointsFromPosition.push(x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + BEFORE_TEXTURE_POSITION[0], (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + BEFORE_TEXTURE_POSITION[1], BEFORE_TEXTURE_POSITION[2]);
                this.pointsToPosition.push(r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0], g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1], b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2]);
                this.pointsColor.push(r / 255, g / 255, b / 255, a / 255);
            }
            this.pointsVBO = [
                createVBO(this.gl, this.pointsFromPosition),
                createVBO(this.gl, this.pointsToPosition),
                createVBO(this.gl, this.pointsColor),
            ];
        }
        setupAfterPointGeometry() {
            const len = imageData.data.length / 4;
            for (let i = 0; i < len; i++) {
                const r = imageData.data[i * 4];
                const g = imageData.data[i * 4 + 1];
                const b = imageData.data[i * 4 + 2];
                imageData.data[i * 4 + 3];
                // 画像のst座標的なもの
                const index = i;
                const x = index % imageData.width;
                const y = Math.floor(index / imageData.width);
                this.afterPointsFromPosition.push(r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0], g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1], b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2]);
                this.afterPointsToPosition.push(x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + AFTER_TEXTURE_POSITION[0], (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + AFTER_TEXTURE_POSITION[1], AFTER_TEXTURE_POSITION[2]);
                const reduceR = reduceImageData.data[i * 4];
                const reduceG = reduceImageData.data[i * 4 + 1];
                const reduceB = reduceImageData.data[i * 4 + 2];
                const reduceA = reduceImageData.data[i * 4 + 3];
                this.afterPointsColor.push(reduceR / 255, reduceG / 255, reduceB / 255, reduceA / 255);
            }
            this.afterPointsVBO = [
                createVBO(this.gl, this.afterPointsFromPosition),
                createVBO(this.gl, this.afterPointsToPosition),
                createVBO(this.gl, this.afterPointsColor),
            ];
        }
        /**
         *
         */
        setupBoxesGeometry() {
            bucketsPerStep.forEach((bucketList, i) => {
                this.boxes[i] = [];
                this.boxesPosition[i] = [];
                this.boxesVBO[i] = [];
                this.boxesIBO[i] = [];
                this.boxesLine[i] = [];
                this.boxesLineVBO[i] = [];
                bucketList.forEach((bucket, j) => {
                    const { total, colors, channel, minR, minG, minB, maxR, maxG, maxB } = bucketsPerStep[i][j];
                    const width = (maxR - minR) / 255;
                    const height = (maxG - minG) / 255;
                    const depth = (maxB - minB) / 255;
                    const color = e.averageColor(colors);
                    const box$1 = box(width, height, depth, [color[0] / 255, color[1] / 255, color[2] / 255, 0.8]);
                    const boxLine$1 = boxLine(width, height, depth, [0.65, 0.65, 0.65, 1.0]);
                    // boxの枠線を作る
                    this.boxesLine[i][j] = boxLine$1;
                    this.boxesLineVBO[i][j] = [createVBO(this.gl, boxLine$1.position), createVBO(this.gl, boxLine$1.color)];
                    this.boxes[i][j] = box$1;
                    this.boxesPosition[i][j] = [
                        minR / 255 - (1 - width) / 2,
                        minG / 255 - (1 - height) / 2,
                        minB / 255 - (1 - depth) / 2,
                    ];
                    this.boxesVBO[i][j] = [createVBO(this.gl, box$1.position), createVBO(this.gl, box$1.color)];
                    // インデックスバッファを生成
                    this.boxesIBO[i][j] = createIBO(this.gl, box$1.index);
                });
            });
        }
        setupAxisGeometry() {
            this.axis = axis(10, [0.45, 0.45, 0.45, 1.0]);
            this.axisVBO = [createVBO(this.gl, this.axis.position), createVBO(this.gl, this.axis.color)];
        }
        setupMvp(position) {
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, position);
            const mvpMatrix = create$3();
            multiply$1(mvpMatrix, this.vpMatrix, mMatrix);
            this.gl.uniformMatrix4fv(this.uniLocation.mvpMatrix, false, mvpMatrix);
        }
        /**
         *
         * @param position
         */
        setupMvpSub(position) {
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, position);
            this.gl.uniformMatrix4fv(this.uniLocationSub.mMatrix, false, mMatrix);
            const mvpMatrix = create$3();
            multiply$1(mvpMatrix, this.vpMatrix, mMatrix);
            this.gl.uniformMatrix4fv(this.uniLocationSub.mvpMatrix, false, mvpMatrix);
        }
        renderBeforeTexture(position) {
            enableAttribute(this.gl, this.beforeImage.VBO, this.attLocation, this.attStride);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.beforeImage.IBO);
            // テクスチャを使うかどうかのフラグをシェーダに送る @@@
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, beforeTexture);
            this.gl.uniform1i(this.uniLocation.textureUnit, 0);
            this.gl.uniform1i(this.uniLocation.isTexture, 1);
            this.gl.enableVertexAttribArray(this.attLocation[2]);
            this.setupMvp(position);
            this.gl.drawElements(this.gl.TRIANGLES, this.beforeImage.geometry.index.length, this.gl.UNSIGNED_SHORT, 0);
        }
        /**
         *
         * @param position
         */
        renderBoxes(position) {
            this.gl.disableVertexAttribArray(this.attLocation[2]);
            this.gl.uniform1i(this.uniLocation.isTexture, 0);
            const lastIndex = this.boxes.length - 1;
            for (let i = 0; i <= paintedBucket; i++) {
                enableAttribute(this.gl, this.boxesVBO[lastIndex][i], this.attLocation, this.attStride);
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.boxesIBO[lastIndex][i]);
                const pos = [
                    position[0] + this.boxesPosition[lastIndex][i][0],
                    position[1] + this.boxesPosition[lastIndex][i][1],
                    position[2] + this.boxesPosition[lastIndex][i][2],
                ];
                this.setupMvp(pos);
                this.gl.drawElements(this.gl.TRIANGLES, this.boxes[lastIndex][i].index.length, this.gl.UNSIGNED_SHORT, 0);
            }
        }
        renderBoxesLine(position) {
            this.gl.disableVertexAttribArray(this.attLocation[2]);
            // テクスチャを使うかどうかのフラグをシェーダに送る @@@
            this.gl.uniform1i(this.uniLocation.isTexture, 0);
            for (let i = 0; i < this.boxes[currentBucket].length; i++) {
                enableAttribute(this.gl, this.boxesLineVBO[currentBucket][i], this.attLocation, this.attStride);
                const pos = [
                    position[0] + this.boxesPosition[currentBucket][i][0],
                    position[1] + this.boxesPosition[currentBucket][i][1],
                    position[2] + this.boxesPosition[currentBucket][i][2],
                ];
                this.setupMvp(pos);
                this.gl.drawArrays(this.gl.LINES, 0, this.boxesLine[currentBucket][i].position.length / 3);
            }
        }
        renderAxis(position) {
            this.gl.uniform1i(this.uniLocation.isTexture, 0);
            this.gl.disableVertexAttribArray(this.attLocation[2]);
            enableAttribute(this.gl, this.axisVBO, this.attLocation, this.attStride);
            this.setupMvp(position);
            this.gl.drawArrays(this.gl.LINES, 0, this.axis.position.length / 3);
        }
        /**
         *
         * @param position
         */
        renderMovePoints(position) {
            const axis = this.taxis.getAxis({ key: 'Sampling' });
            this.gl.uniform1f(this.uniLocationSub.interporation, axis.progress);
            enableAttribute(this.gl, this.pointsVBO, this.attLocationSub, this.attStrideSub);
            this.setupMvpSub(position);
            this.gl.drawArrays(this.gl.POINTS, 0, this.pointsToPosition.length / 3);
        }
        renderMoveAfterPoints(position) {
            const axis = this.taxis.getAxis({ key: 'Mapping' });
            if (axis.progress === 0) {
                return;
            }
            this.gl.uniform1f(this.uniLocationSub.interporation, axis.progress);
            enableAttribute(this.gl, this.afterPointsVBO, this.attLocationSub, this.attStrideSub);
            this.setupMvpSub(position);
            this.gl.drawArrays(this.gl.POINTS, 0, this.afterPointsToPosition.length / 3);
        }
        /**
         * render処理
         */
        render() {
            this.taxis.begin();
            this.taxis.ticker((delta, axes) => {
                let currentStep = 0;
                if (axes.get('Sampling').pass) {
                    currentStep = 1;
                }
                if (axes.get('split#7').pass) {
                    currentStep = 2;
                }
                if (axes.get('Average color#7').pass) {
                    currentStep = 3;
                }
                for (let i = 0; i < get_store_value(settings).bucketsCount; i++) {
                    if (axes.get(`split#${i}`).enter) {
                        if (currentBucket < i) {
                            currentBucket = i;
                        }
                    }
                    if (axes.get(`Average color#${i}`).enter) {
                        if (paintedBucket < i) {
                            paintedBucket = i;
                        }
                    }
                    if (axes.get(`split#${i}`).progress <= 0) {
                        if (i <= currentBucket) {
                            currentBucket = i - 1;
                        }
                    }
                    if (axes.get(`Average color#${i}`).progress <= 0) {
                        if (i <= paintedBucket) {
                            paintedBucket = i - 1;
                        }
                    }
                }
                steps.update(currentStep);
                this.setupRendering();
                // subの描画
                this.gl.useProgram(this.programSub);
                this.gl.uniform3fv(this.uniLocationSub.eyePosition, this.camera.position);
                this.renderMovePoints([0.0, 0.0, 0.0]);
                this.renderMoveAfterPoints([0.0, 0.0, 0.0]);
                // mainの描画
                this.gl.useProgram(this.programMain);
                this.renderAxis([0.0, 0.0, 0.0]);
                this.renderBeforeTexture(BEFORE_TEXTURE_POSITION);
                if (axes.get('split#0').enter) {
                    this.renderBoxesLine(BOXES_POSITION);
                    if (-1 < paintedBucket) {
                        this.renderBoxes(BOXES_POSITION);
                    }
                }
            });
        }
    }

    /* src/components/Viewer/Viewer.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/components/Viewer/Viewer.svelte";

    function create_fragment$2(ctx) {
    	let canvas;
    	let t;
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			t = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(canvas, "class", "w-full h-full");
    			add_location(canvas, file$2, 13, 0, 292);
    			attr_dev(div0, "id", "timeline");
    			attr_dev(div0, "class", "h-full");
    			add_location(div0, file$2, 15, 2, 412);
    			attr_dev(div1, "class", "fixed left-0 right-0 bottom-0 h-1/5");
    			add_location(div1, file$2, 14, 0, 360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[2](canvas);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[3](div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[2](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			/*div0_binding*/ ctx[3](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Viewer", slots, []);
    	let canvasElement;
    	let timelineElement;
    	const scene = new Scene();

    	onMount(() => {
    		scene.init(canvasElement, timelineElement);
    	});

    	onDestroy(() => {
    		scene.destroy();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Viewer> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			timelineElement = $$value;
    			$$invalidate(1, timelineElement);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		Scene,
    		canvasElement,
    		timelineElement,
    		scene
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvasElement" in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ("timelineElement" in $$props) $$invalidate(1, timelineElement = $$props.timelineElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, timelineElement, canvas_binding, div0_binding];
    }

    class Viewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Viewer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Introduction.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/components/Introduction.svelte";

    function create_fragment$1(ctx) {
    	let div17;
    	let div8;
    	let div7;
    	let div6;
    	let div1;
    	let div0;
    	let t0;
    	let div5;
    	let h1;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let p0;
    	let t5;
    	let br;
    	let t6;
    	let t7;
    	let div4;
    	let form;
    	let div3;
    	let div2;
    	let svg;
    	let path;
    	let t8;
    	let p1;
    	let label;
    	let t9;
    	let input;
    	let t10;
    	let t11;
    	let p2;
    	let t13;
    	let div16;
    	let div15;
    	let p3;
    	let t15;
    	let div14;
    	let div9;
    	let img0;
    	let img0_src_value;
    	let t16;
    	let span2;
    	let t17;
    	let a0;
    	let t19;
    	let a1;
    	let t21;
    	let div10;
    	let img1;
    	let img1_src_value;
    	let t22;
    	let span3;
    	let t23;
    	let a2;
    	let t25;
    	let a3;
    	let t27;
    	let div11;
    	let img2;
    	let img2_src_value;
    	let t28;
    	let span4;
    	let t29;
    	let a4;
    	let t31;
    	let a5;
    	let t33;
    	let div12;
    	let img3;
    	let img3_src_value;
    	let t34;
    	let span5;
    	let t35;
    	let a6;
    	let t37;
    	let a7;
    	let t39;
    	let div13;
    	let img4;
    	let img4_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div5 = element("div");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Visualize color reduction";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Any image you like.";
    			t4 = space();
    			p0 = element("p");
    			t5 = text("The logic of color reduction is difficult.\n            I hope that visualizing it will help you understand it.\n            Implemented with reference to Median cut.\n            It is implemented using webgl.");
    			br = element("br");
    			t6 = text("\n            Sorry, maybe only chrome is supported.");
    			t7 = space();
    			div4 = element("div");
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t8 = space();
    			p1 = element("p");
    			label = element("label");
    			t9 = text("Upload a file\n                      ");
    			input = element("input");
    			t10 = text("\n                    or drag and drop");
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "PNG, JPG, GIF up to 10MB";
    			t13 = space();
    			div16 = element("div");
    			div15 = element("div");
    			p3 = element("p");
    			p3.textContent = "Or try one of these:";
    			t15 = space();
    			div14 = element("div");
    			div9 = element("div");
    			img0 = element("img");
    			t16 = space();
    			span2 = element("span");
    			t17 = text("Photo by ");
    			a0 = element("a");
    			a0.textContent = "Vincent Ledvina";
    			t19 = text("\n            on\n            ");
    			a1 = element("a");
    			a1.textContent = "Unsplash";
    			t21 = space();
    			div10 = element("div");
    			img1 = element("img");
    			t22 = space();
    			span3 = element("span");
    			t23 = text("Photo by ");
    			a2 = element("a");
    			a2.textContent = "Greyson Joralemon";
    			t25 = text("\n            on\n            ");
    			a3 = element("a");
    			a3.textContent = "Unsplash";
    			t27 = space();
    			div11 = element("div");
    			img2 = element("img");
    			t28 = space();
    			span4 = element("span");
    			t29 = text("Photo by ");
    			a4 = element("a");
    			a4.textContent = "Jezael Melgoza";
    			t31 = text("\n            on\n            ");
    			a5 = element("a");
    			a5.textContent = "Unsplash";
    			t33 = space();
    			div12 = element("div");
    			img3 = element("img");
    			t34 = space();
    			span5 = element("span");
    			t35 = text("Photo by ");
    			a6 = element("a");
    			a6.textContent = "Nick Fewings";
    			t37 = text("\n            on\n            ");
    			a7 = element("a");
    			a7.textContent = "Unsplash";
    			t39 = space();
    			div13 = element("div");
    			img4 = element("img");
    			attr_dev(div0, "class", "h-full w-full bg-gray-100");
    			add_location(div0, file$1, 68, 10, 2057);
    			attr_dev(div1, "class", "absolute inset-0");
    			add_location(div1, file$1, 67, 8, 2016);
    			attr_dev(span0, "class", "block text-gray-800");
    			add_location(span0, file$1, 72, 12, 2304);
    			attr_dev(span1, "class", "block text-gray-500");
    			add_location(span1, file$1, 73, 12, 2383);
    			attr_dev(h1, "class", "text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl");
    			add_location(h1, file$1, 71, 10, 2204);
    			add_location(br, file$1, 79, 42, 2770);
    			attr_dev(p0, "class", "mt-6 max-w-lg mx-auto text-center text-xl text-gray-500 sm:max-w-4xl");
    			add_location(p0, file$1, 75, 10, 2470);
    			attr_dev(path, "d", "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			add_location(path, file$1, 88, 20, 3155);
    			attr_dev(svg, "class", "mx-auto h-12 w-12 text-gray-500");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 48 48");
    			add_location(svg, file$1, 87, 18, 3035);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "id", "original-image-file");
    			attr_dev(input, "class", "hidden");
    			add_location(input, file$1, 100, 22, 3934);
    			attr_dev(label, "id", "original-image-label");
    			attr_dev(label, "for", "original-image-file");
    			attr_dev(label, "class", "cursor-pointer font-medium text-pink-600 hover:text-pink-500 focus:outline-none focus:underline transition duration-150 ease-in-out");
    			add_location(label, file$1, 95, 20, 3610);
    			attr_dev(p1, "class", "mt-1 text-sm text-gray-500");
    			add_location(p1, file$1, 94, 18, 3551);
    			attr_dev(p2, "class", "mt-1 text-xs text-gray-500");
    			add_location(p2, file$1, 104, 18, 4103);
    			attr_dev(div2, "class", "text-center");
    			add_location(div2, file$1, 86, 16, 2991);
    			attr_dev(div3, "class", "sm:mt-0 sm:col-span-2");
    			add_location(div3, file$1, 85, 14, 2939);
    			attr_dev(form, "action", "");
    			add_location(form, file$1, 84, 12, 2908);
    			attr_dev(div4, "id", "upload");
    			attr_dev(div4, "class", "px-4 py-8 sm:px-0");
    			add_location(div4, file$1, 83, 10, 2852);
    			attr_dev(div5, "class", "relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8");
    			add_location(div5, file$1, 70, 8, 2126);
    			attr_dev(div6, "id", "upload-area");
    			attr_dev(div6, "class", "h-full flex flex-col justify-center relative shadow-lg sm:overflow-hidden");
    			add_location(div6, file$1, 66, 6, 1902);
    			attr_dev(div7, "class", "w-full h-full");
    			add_location(div7, file$1, 65, 4, 1868);
    			attr_dev(div8, "class", "relative flex-grow");
    			add_location(div8, file$1, 64, 2, 1831);
    			attr_dev(p3, "class", "text-center text-sm font-semibold uppercase text-gray-500 tracking-wide");
    			add_location(p3, file$1, 117, 6, 4419);
    			if (img0.src !== (img0_src_value = "./assets/bison.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "cursor-pointer");
    			add_location(img0, file$1, 120, 10, 4704);
    			attr_dev(a0, "href", "https://unsplash.com/@vincentledvina?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a0, file$1, 122, 22, 4831);
    			attr_dev(a1, "href", "https://unsplash.com/s/visual/4050ed5c-59f1-4b72-965f-8d82efcfbc94?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a1, file$1, 126, 12, 5029);
    			add_location(span2, file$1, 121, 10, 4803);
    			attr_dev(div9, "class", "col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1");
    			add_location(div9, file$1, 119, 8, 4613);
    			if (img1.src !== (img1_src_value = "./assets/colorful.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "cursor-pointer");
    			add_location(img1, file$1, 132, 10, 5357);
    			attr_dev(a2, "href", "https://unsplash.com/@greysonjoralemon?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a2, file$1, 134, 22, 5487);
    			attr_dev(a3, "href", "https://unsplash.com/s/photos/colorful?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a3, file$1, 138, 12, 5689);
    			add_location(span3, file$1, 133, 10, 5459);
    			attr_dev(div10, "class", "col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1");
    			add_location(div10, file$1, 131, 8, 5266);
    			if (img2.src !== (img2_src_value = "./assets/shibuya.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			attr_dev(img2, "class", "cursor-pointer");
    			add_location(img2, file$1, 144, 10, 5989);
    			attr_dev(a4, "href", "https://unsplash.com/@jezael?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a4, file$1, 146, 22, 6118);
    			attr_dev(a5, "href", "https://unsplash.com/s/photos/japan?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a5, file$1, 150, 12, 6307);
    			add_location(span4, file$1, 145, 10, 6090);
    			attr_dev(div11, "class", "col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1");
    			add_location(div11, file$1, 143, 8, 5898);
    			if (img3.src !== (img3_src_value = "./assets/telephone_booth.jpg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			attr_dev(img3, "class", "cursor-pointer");
    			add_location(img3, file$1, 156, 10, 6604);
    			attr_dev(a6, "href", "https://unsplash.com/@jannerboy62?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a6, file$1, 158, 22, 6741);
    			attr_dev(a7, "href", "https://unsplash.com/s/photos/red?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText");
    			add_location(a7, file$1, 162, 12, 6933);
    			add_location(span5, file$1, 157, 10, 6713);
    			attr_dev(div12, "class", "col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1");
    			add_location(div12, file$1, 155, 8, 6513);
    			if (img4.src !== (img4_src_value = "./assets/pineapple.jpg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			attr_dev(img4, "class", "cursor-pointer");
    			add_location(img4, file$1, 168, 10, 7228);
    			attr_dev(div13, "class", "col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1");
    			add_location(div13, file$1, 167, 8, 7137);
    			attr_dev(div14, "class", "mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5");
    			add_location(div14, file$1, 118, 6, 4533);
    			attr_dev(div15, "class", "max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8");
    			add_location(div15, file$1, 116, 4, 4354);
    			attr_dev(div16, "class", "bg-gray-100");
    			add_location(div16, file$1, 115, 2, 4324);
    			attr_dev(div17, "class", "h-full flex flex-col");
    			add_location(div17, file$1, 62, 0, 1773);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div5);
    			append_dev(div5, h1);
    			append_dev(h1, span0);
    			append_dev(h1, t2);
    			append_dev(h1, span1);
    			append_dev(div5, t4);
    			append_dev(div5, p0);
    			append_dev(p0, t5);
    			append_dev(p0, br);
    			append_dev(p0, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, form);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, svg);
    			append_dev(svg, path);
    			append_dev(div2, t8);
    			append_dev(div2, p1);
    			append_dev(p1, label);
    			append_dev(label, t9);
    			append_dev(label, input);
    			append_dev(p1, t10);
    			append_dev(div2, t11);
    			append_dev(div2, p2);
    			append_dev(div17, t13);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, p3);
    			append_dev(div15, t15);
    			append_dev(div15, div14);
    			append_dev(div14, div9);
    			append_dev(div9, img0);
    			append_dev(div9, t16);
    			append_dev(div9, span2);
    			append_dev(span2, t17);
    			append_dev(span2, a0);
    			append_dev(span2, t19);
    			append_dev(span2, a1);
    			append_dev(div14, t21);
    			append_dev(div14, div10);
    			append_dev(div10, img1);
    			append_dev(div10, t22);
    			append_dev(div10, span3);
    			append_dev(span3, t23);
    			append_dev(span3, a2);
    			append_dev(span3, t25);
    			append_dev(span3, a3);
    			append_dev(div14, t27);
    			append_dev(div14, div11);
    			append_dev(div11, img2);
    			append_dev(div11, t28);
    			append_dev(div11, span4);
    			append_dev(span4, t29);
    			append_dev(span4, a4);
    			append_dev(span4, t31);
    			append_dev(span4, a5);
    			append_dev(div14, t33);
    			append_dev(div14, div12);
    			append_dev(div12, img3);
    			append_dev(div12, t34);
    			append_dev(div12, span5);
    			append_dev(span5, t35);
    			append_dev(span5, a6);
    			append_dev(span5, t37);
    			append_dev(span5, a7);
    			append_dev(div14, t39);
    			append_dev(div14, div13);
    			append_dev(div13, img4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*handleSelect*/ ctx[0], false, false, false),
    					listen_dev(img1, "click", /*handleSelect*/ ctx[0], false, false, false),
    					listen_dev(img2, "click", /*handleSelect*/ ctx[0], false, false, false),
    					listen_dev(img3, "click", /*handleSelect*/ ctx[0], false, false, false),
    					listen_dev(img4, "click", /*handleSelect*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(1, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Introduction", slots, []);

    	onMount(() => {
    		const uploadArea = document.getElementById("upload-area");

    		uploadArea.addEventListener("change", e => {
    			changeHandler({
    				e,
    				data: undefined,
    				callback: image => {
    					set_store_value(app$1, $app.file = image, $app);
    				}
    			});
    		});

    		uploadArea.addEventListener("drop", e => {
    			e.preventDefault();

    			changeHandler({
    				e,
    				data: e.dataTransfer.files[0],
    				callback: image => {
    					set_store_value(app$1, $app.file = image, $app);
    				}
    			});
    		});

    		uploadArea.addEventListener("dragenter", e => {
    			e.preventDefault();
    		});

    		uploadArea.addEventListener("dragover", e => {
    			e.preventDefault();
    		});

    		uploadArea.addEventListener("dragleave", e => {
    			e.preventDefault();
    		});

    		const changeHandler = ({ e, data, callback }) => {
    			// drag and dropの場合は e.dataTransfer.files[0] を使用
    			let file = data === undefined ? e.target.files[0] : data;

    			// 拡張子チェック
    			if (!file.type.match(/^image\/(png|jpg|jpeg|gif)$/)) {
    				return;
    			}

    			// 容量チェック(5MB)
    			if (10 * 1024 * 1024 <= file.size) {
    				return;
    			}

    			let image = new Image();
    			let fileReader = new FileReader();

    			fileReader.onload = e => {
    				let base64 = e.target.result;

    				image.onload = () => {
    					callback(image);
    				};

    				image.src = base64;
    			};

    			fileReader.readAsDataURL(file);
    		};
    	});

    	const handleSelect = e => {
    		set_store_value(app$1, $app.file = e.currentTarget, $app);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Introduction> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, app: app$1, handleSelect, $app });
    	return [handleSelect];
    }

    class Introduction extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Introduction",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */
    const file = "src/App.svelte";

    // (13:2) {:else}
    function create_else_block(ctx) {
    	let viewer;
    	let t0;
    	let div0;
    	let nav;
    	let t1;
    	let div1;
    	let svg;
    	let path;
    	let current;
    	let mounted;
    	let dispose;

    	viewer = new Viewer({
    			props: { class: "w-full h-full" },
    			$$inline: true
    		});

    	nav = new Nav({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(viewer.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(nav.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(div0, "class", "fixed right-8 top-8 hidden md:block");
    			add_location(div0, file, 14, 4, 399);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M6 18L18 6M6 6l12 12");
    			add_location(path, file, 19, 8, 685);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-8 text-gray-800");
    			add_location(svg, file, 18, 6, 591);
    			attr_dev(div1, "class", "fixed left-8 top-8 bg-gray-100 p-2 cursor-pointer rounded-full");
    			add_location(div1, file, 17, 4, 482);
    		},
    		m: function mount(target, anchor) {
    			mount_component(viewer, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(nav, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, svg);
    			append_dev(svg, path);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*handleRemove*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(viewer.$$.fragment, local);
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(viewer.$$.fragment, local);
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(viewer, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			destroy_component(nav);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(13:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (11:2) {#if !$app.file}
    function create_if_block(ctx) {
    	let introduction;
    	let current;
    	introduction = new Introduction({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(introduction.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(introduction, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(introduction.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(introduction.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(introduction, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:2) {#if !$app.file}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$app*/ ctx[0].file) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "w-full h-full");
    			add_location(main, file, 9, 0, 279);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const handleRemove = () => {
    		set_store_value(app$1, $app.file = null, $app);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		app: app$1,
    		Nav,
    		Viewer,
    		Introduction,
    		handleRemove,
    		$app
    	});

    	return [$app, handleRemove];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
