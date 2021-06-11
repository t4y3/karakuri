
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

    /**
     * WebGL の API を目的別にまとめたユーティリティクラス
     * @class
     */
    class WebGLUtility {
        /**
         * ファイルをテキストとして開く
         * @static
         * @param {string} path - 読み込むファイルのパス
         * @return {Promise}
         */
        static loadFile(path){
            return new Promise((resolve, reject) => {
                // fetch を使ってファイルにアクセスする
                fetch(path)
                  .then((res) => {
                      // テキストとして処理する
                      return res.text();
                  })
                  .then((text) => {
                      // テキストを引数に Promise を解決する
                      resolve(text);
                  })
                  .catch((err) => {
                      // なんらかのエラー
                      reject(err);
                  });
            });
        }

        /**
         * プロパティとして保持する canvas の幅
         * @type {number} w - canvas に設定する横幅
         */
        set width(w){
            this.canvas.width = w;
        }
        get width(){
            return this.canvas.width;
        }
        /**
         * プロパティとして保持する canvas の高さ
         * @type {number} h - canvas に設定する縦方向の高さ
         */
        set height(h){
            this.canvas.height = h;
        }
        get height(){
            return this.canvas.height;
        }
        /**
         * プロパティとして保持する WebGL コンテキストにプログラムオブジェクトを設定する
         * @type {WebGLProgram} prg - 設定するプログラムオブジェクト
         */
        set program(prg){
            // gl.useProgram で利用するプログラムオブジェクトを設定できる
            this.gl.useProgram(prg);
            // あとで取り出すこともできるようプロパティに保持しておく
            this.currentProgram = prg;
        }
        get program(){
            return this.currentProgram;
        }

        /**
         * @constructor
         */
        constructor(){
            this.canvas = null;
            this.gl = null;
            this.currentProgram = null;
        }
        /**
         * canvas を受け取り WebGL コンテキストを初期化する
         * @param {HTMLCanvasElement} canvas - WebGL コンテキストを取得する canvas 要素
         * @param {boolean} isWebGL2 - WebGL2 コンテキストを利用するかどうかの真偽値
         */
        initialize(canvas, isWebGL2){
            // プロパティに保持しておく
            this.canvas = canvas;
            // canvas から WebGL コンテキスト取得を試みる
            this.gl = this.canvas.getContext(`webgl${isWebGL2 === true ? '2' : ''}`);
            if(this.gl == null){
                // WebGL コンテキストが取得できない場合はエラー
                throw new Error('webgl not supported');
            }
        }
        /**
         * ソースコードからシェーダオブジェクトを生成する
         * @param {string} source - シェーダのソースコード
         * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
         * @return {WebGLShader}
         */
        createShaderObject(source, type){
            const gl = this.gl;
            // 空のシェーダオブジェクトを生成する
            const shader = gl.createShader(type);
            // シェーダオブジェクトにソースコードを割り当てる
            gl.shaderSource(shader, source);
            // シェーダをコンパイルする
            gl.compileShader(shader);
            // コンパイル後のステータスを確認し問題なければシェーダオブジェクトを返す
            if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
                return shader;
            }else {
                throw new Error(gl.getShaderInfoLog(shader));
            }
        }
        /**
         * シェーダオブジェクトからプログラムオブジェクトを生成する
         * @param {WebGLShader} vs - 頂点シェーダのシェーダオブジェクト
         * @param {WebGLShader} fs - フラグメントシェーダのシェーダオブジェクト
         * @return {WebGLProgram}
         */
        createProgramObject(vs, fs){
            const gl = this.gl;
            // 空のプログラムオブジェクトを生成する
            const program = gl.createProgram();
            // ２つのシェーダをアタッチ（関連付け）する
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            // シェーダオブジェクトをリンクする
            gl.linkProgram(program);
            // リンクが完了するとシェーダオブジェクトは不要になるので削除する
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            // リンク後のステータスを確認し問題なければプログラムオブジェクトを返す
            if(gl.getProgramParameter(program, gl.LINK_STATUS)){
                gl.useProgram(program);
                return program;
            }else {
                throw new Error(gl.getProgramInfoLog(program));
            }
        }
        /**
         * シェーダオブジェクトからプログラムオブジェクトを生成する（transform feedback 対応版）
         * @param {WebGLShader} vs - 頂点シェーダのシェーダオブジェクト
         * @param {WebGLShader} fs - フラグメントシェーダのシェーダオブジェクト
         * @param {Array.<string>} varyings - 対象の varying 変数名の配列
         * @return {WebGLProgram}
         */
        createProgramObjectTF(vs, fs, varyings){
            const gl = this.gl;
            // 空のプログラムオブジェクトを生成する
            const program = gl.createProgram();
            // ２つのシェーダをアタッチ（関連付け）する
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            // プログラムオブジェクトに対して varying 変数を設定する
            gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
            // シェーダオブジェクトをリンクする
            gl.linkProgram(program);
            // リンクが完了するとシェーダオブジェクトは不要になるので削除する
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            // リンク後のステータスを確認し問題なければプログラムオブジェクトを返す
            if(gl.getProgramParameter(program, gl.LINK_STATUS)){
                gl.useProgram(program);
                return program;
            }else {
                throw new Error(gl.getProgramInfoLog(program));
            }
        }
        /**
         * JavaScript の配列から VBO（Vertex Buffer Object）を生成する
         * @param {Array.<number>} vertexArray - 頂点属性情報の配列
         * @return {WebGLBuffer}
         */
        createVBO(vertexArray){
            const gl = this.gl;
            // 空のバッファオブジェクトを生成する
            const vbo = gl.createBuffer();
            // バッファを gl.ARRAY_BUFFER としてバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            // バインドしたバッファに Float32Array オブジェクトに変換した配列を設定する
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
            // 安全のために最後にバインドを解除してからバッファオブジェクトを返す
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            return vbo;
        }
        /**
         * JavaScript の配列から IBO（Index Buffer Object）を生成する
         * @param {Array.<number>} indexArray - 頂点属性情報の配列
         * @return {WebGLBuffer}
         */
        createIBO(indexArray){
            const gl = this.gl;
            // 空のバッファオブジェクトを生成する
            const ibo = gl.createBuffer();
            // バッファを gl.ELEMENT_ARRAY_BUFFER としてバインドする
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            // バインドしたバッファに Float32Array オブジェクトに変換した配列を設定する
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indexArray), gl.STATIC_DRAW);
            // 安全のために最後にバインドを解除してからバッファオブジェクトを返す
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return ibo;
        }
        /**
         * 頂点属性情報を有効化しロケーションと紐付ける
         * @param {Array.<WebGLBuffer>} vbo - 頂点属性を格納した VBO の配列
         * @param {Array.<number>} attLocation - 頂点属性ロケーションの配列
         * @param {Array.<number>} attStride - 頂点属性のストライドの配列
         */
        enableAttribute(vbo, attLocation, attStride){
            const gl = this.gl;
            vbo.forEach((buffer, index) => {
                // 有効化したいバッファをまずバインドする
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                // 頂点属性ロケーションの有効化を行う
                gl.enableVertexAttribArray(attLocation[index]);
                // 対象のロケーションのストライドやデータ型を設定する
                gl.vertexAttribPointer(attLocation[index], attStride[index], gl.FLOAT, false, 0, 0);
            });
        }
        /**
         * テクスチャ用のリソースからテクスチャを生成する
         * @param {string} resource - Image や Canvas などのテクスチャ用リソース
         * @return {WebGLTexture}
         */
        createTexture(resource, unit){
            const gl = this.gl;
            // テクスチャオブジェクトを生成
            const texture = gl.createTexture();
            // アクティブなテクスチャユニット番号を指定する
            gl.activeTexture(unit);
            // テクスチャをアクティブなユニットにバインドする
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // バインドしたテクスチャにデータを割り当て（ここで画像のロードが完了している必要がある）
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource);
            // ミップマップを自動生成する
            gl.generateMipmap(gl.TEXTURE_2D);
            // テクスチャパラメータを設定する
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // 安全の為にテクスチャのバインドを解除してから返す
            gl.bindTexture(gl.TEXTURE_2D, null);
            return texture;
        }
        /**
         * キューブマップテクスチャを非同期に生成する Promise を返す
         * @param {Array.<string>} source - 読み込む画像のパスの配列
         * @param {Array.<number>} target - 画像にそれぞれ対応させるターゲット定数の配列
         * @return {Promise} テクスチャを引数に渡して解決する Promise
         */
        createCubeTextureFromFile(source, target){
            return new Promise((resolve) => {
                const gl = this.gl;
                // テクスチャオブジェクトを生成
                const texture = gl.createTexture();
                // アクティブなテクスチャユニット番号を指定する
                gl.activeTexture(gl.TEXTURE0);
                // テクスチャをアクティブなユニットにキューブテクスチャとしてバインドする
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

                // 画像を個々に読み込む Promise を生成し配列に入れておく
                const promises = source.map((src, index) => {
                    // 画像の読み込みが完了し、テクスチャに画像を割り当てたら解決する Promise
                    return new Promise((loadedResolve) => {
                        // 空の画像オブジェクト
                        const img = new Image();
                        // ロード完了時の処理を先に登録
                        img.addEventListener('load', () => {
                            // 読み込んだ画像をテクスチャに割り当てる
                            gl.texImage2D(target[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                            // Promise を解決する
                            loadedResolve();
                        }, false);
                        // 画像のソースを設定
                        img.src = src;
                    });
                });

                // すべての Promise を一気に実行する
                Promise.all(promises)
                  .then(() => {
                      // ミップマップを自動生成する
                      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                      // テクスチャパラメータを設定する
                      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                      // 安全の為にテクスチャのバインドを解除してから Promise を解決する
                      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                      // Promise を解決する際、生成したテクスチャを引数から返す
                      resolve(texture);
                  });
            });
        }
        /**
         * フレームバッファを生成する
         * @param {number} width - フレームバッファの幅
         * @param {number} height - フレームバッファの高さ
         * @return {object}
         * @property {WebGLFramebuffer} framebuffer - フレームバッファオブジェクト
         * @property {WebGLRenderbuffer} depthRenderBuffer - 深度バッファ用のレンダーバッファ
         * @property {WebGLTexture} texture - カラーバッファ用のテクスチャオブジェクト
         */
        createFramebuffer(width, height){
            const gl = this.gl;

            const framebuffer       = gl.createFramebuffer();  // フレームバッファ
            const depthRenderBuffer = gl.createRenderbuffer(); // レンダーバッファ
            const texture           = gl.createTexture();      // テクスチャ
            // フレームバッファをバインド
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            // レンダーバッファをバインド
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
            // レンダーバッファを深度バッファとして設定する
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            // フレームバッファにレンダーバッファを関連付けする
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
            // テクスチャをユニット０にバインド
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // テクスチャにサイズなどを設定する（ただし中身は null）
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            // テクスチャパラメータを設定
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // フレームバッファにテクスチャを関連付けする
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            // すべてのオブジェクトは念の為バインドを解除しておく
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // 各オブジェクトを、JavaScript のオブジェクトに格納して返す
            return {
                framebuffer: framebuffer,
                depthRenderbuffer: depthRenderBuffer,
                texture: texture
            };
        }
    }

    /**
     * three.js の OrbitControls に似た挙動のカメラ操作用ユーティリティクラス
     * @class
     */
    class WebGLOrbitCamera {
        /** @type {number} */
        static get DEFAULT_DISTANCE(){return 5.0;};
        /** @type {number} */
        static get DEFAULT_MIN_DISTANCE(){return 1.0;};
        /** @type {number} */
        static get DEFAULT_MAX_DISTANCE(){return 10.0;};
        /** @type {number} */
        static get DEFAULT_MOVE_SCALE(){return 2.0;};

        /**
         * @constructor
         * @param {HTMLElement} target - イベントを設定するターゲットエレメント
         * @param {object} [option={}]
         * @property {number} option.distance - カメラの原点からの距離
         * @property {number} option.min - カメラが原点に寄れる最小距離
         * @property {number} option.max - カメラが原点から離れられる最大距離
         * @property {number} option.move - カメラが平行移動する際のスケール
         */
        constructor(target, option = {}){
            this.target             = target;
            this.distance           = option.distance || WebGLOrbitCamera.DEFAULT_DISTANCE;
            this.minDistance        = option.min || WebGLOrbitCamera.DEFAULT_MIN_DISTANCE;
            this.maxDistance        = option.max || WebGLOrbitCamera.DEFAULT_MAX_DISTANCE;
            this.moveScale          = option.move || WebGLOrbitCamera.DEFAULT_MOVE_SCALE;
            this.position           = [0.0, 0.0, this.distance];
            this.center             = [0.0, 0.0, 0.0];
            this.upDirection        = [0.0, 1.0, 0.0];
            this.moveX              = [1.0, 0.0, 0.0];
            this.moveZ              = [0.0, 0.0, 1.0];
            this.defaultPosition    = [0.0, 0.0, this.distance];
            this.defaultCenter      = [0.0, 0.0, 0.0];
            this.defaultUpDirection = [0.0, 1.0, 0.0];
            this.defaultMoveX       = [1.0, 0.0, 0.0];
            this.defaultMoveZ       = [0.0, 0.0, 1.0];
            this.movePosition       = [0.0, 0.0, 0.0];
            this.rotateX            = 0.0;
            this.rotateY            = 0.0;
            this.scale              = 0.0;
            this.isDown             = false;
            this.prevPosition       = [0, 0];
            this.offsetPosition     = [0, 0];
            this.qt                 = Qtn.create();
            this.qtx                = Qtn.create();
            this.qty                = Qtn.create();

            // self binding
            this.mouseInteractionStart = this.mouseInteractionStart.bind(this);
            this.mouseInteractionMove  = this.mouseInteractionMove.bind(this);
            this.mouseInteractionEnd   = this.mouseInteractionEnd.bind(this);
            this.wheelScroll           = this.wheelScroll.bind(this);

            // event
            this.target.addEventListener('mousedown', this.mouseInteractionStart, false);
            this.target.addEventListener('mousemove', this.mouseInteractionMove,  false);
            this.target.addEventListener('mouseup',   this.mouseInteractionEnd,   false);
            // this.target.addEventListener('wheel',     this.wheelScroll,           false);
            this.target.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            }, false);
        }
        /**
         * マウスボタンが押された際のイベント
         */
        mouseInteractionStart(event){
            this.isDown = true;
            const bound = this.target.getBoundingClientRect();
            this.prevPosition = [
                event.clientX - bound.left,
                event.clientY - bound.top,
            ];
        }
        /**
         * マウスが移動した際のイベント
         */
        mouseInteractionMove(event){
            if(this.isDown !== true){return;}
            const bound = this.target.getBoundingClientRect();
            const w = bound.width;
            const h = bound.height;
            const x = event.clientX - bound.left;
            const y = event.clientY - bound.top;
            const s = 1.0 / Math.min(w, h);
            this.offsetPosition = [
                x - this.prevPosition[0],
                y - this.prevPosition[1],
            ];
            this.prevPosition = [x, y];
            switch(event.buttons){
                case 1: // 左ボタン
                    this.rotateX += this.offsetPosition[0] * s;
                    this.rotateY += this.offsetPosition[1] * s;
                    this.rotateX = this.rotateX % 1.0;
                    this.rotateY = Math.min(Math.max(this.rotateY % 1.0, -0.25), 0.25);
                    break;
                case 2: // 右ボタン
                    const PI2 = Math.PI * 2.0;
                    const scaleX = this.offsetPosition[0] * s * this.moveScale;
                    const scaleZ = this.offsetPosition[1] * s * this.moveScale;
                    const xDirection = this.defaultMoveX.slice();
                    const zDirection = this.defaultMoveZ.slice();
                    const q = Qtn.identity(Qtn.create());
                    Qtn.rotate(this.rotateX * PI2, [0.0, 1.0, 0.0], q);
                    Qtn.toVecIII(xDirection, q, this.moveX);
                    Qtn.toVecIII(zDirection, q, this.moveZ);
                    this.movePosition[0] -= this.moveX[0] * scaleX + this.moveZ[0] * scaleZ;
                    this.movePosition[2] -= this.moveX[2] * scaleX + this.moveZ[2] * scaleZ;
                    break;
            }
        }
        /**
         * マウスボタンが離された際のイベント
         */
        mouseInteractionEnd(event){
            this.isDown = false;
        }
        /**
         * スクロール操作に対するイベント
         */
        wheelScroll(event){
            const w = event.wheelDelta;
            if(w > 0){
                this.scale = -0.5;
            }else if(w < 0){
                this.scale = 0.5;
            }
        }
        /**
         * 現在のパラメータからビュー行列を生成して返す
         * @return {Mat4}
         */
        update(){
            const PI2 = Math.PI * 2.0;
            const v = [1.0, 0.0, 0.0];
            // scale
            this.scale *= 0.7;
            this.distance += this.scale;
            this.distance = Math.min(Math.max(this.distance, this.minDistance), this.maxDistance);
            this.defaultPosition[2] = this.distance;
            // rotate
            Qtn.identity(this.qt);
            Qtn.identity(this.qtx);
            Qtn.identity(this.qty);
            Qtn.rotate(this.rotateX * PI2, [0.0, 1.0, 0.0], this.qtx);
            Qtn.toVecIII(v, this.qtx, v);
            Qtn.rotate(this.rotateY * PI2, v, this.qty);
            Qtn.multiply(this.qtx, this.qty, this.qt);
            Qtn.toVecIII(this.defaultPosition, this.qt, this.position);
            Qtn.toVecIII(this.defaultUpDirection, this.qt, this.upDirection);
            // translate
            this.position[0] += this.movePosition[0];
            this.position[1] += this.movePosition[1];
            this.position[2] += this.movePosition[2];
            this.center[0] = this.defaultCenter[0] + this.movePosition[0];
            this.center[1] = this.defaultCenter[1] + this.movePosition[1];
            this.center[2] = this.defaultCenter[2] + this.movePosition[2];

            return Mat4.lookAt(this.position, this.center, this.upDirection);
        }
    }

    /**
     * ベクトルや行列演算の機能を提供する
     * @class
     */
    class WebGLMath {
        /**
         * @static
         * @type {Mat4}
         */
        static get mat4(){return Mat4;}
        /**
         * @static
         * @type {Vec3}
         */
        static get vec3(){return Vec3;}
        /**
         * @static
         * @type {Vec2}
         */
        static get vec2(){return Vec2;}
        /**
         * @static
         * @type {Qtn}
         */
        static get qtn(){return Qtn;}
    }

    /**
     * Mat4
     * @class Mat4
     */
    class Mat4 {
        /**
         * 4x4 の正方行列を生成する
         * @return {Float32Array} 行列格納用の配列
         */
        static create(){
            return new Float32Array(16);
        }
        /**
         * 行列を単位化する（参照に注意）
         * @param {Mat4} dest - 単位化する行列
         * @return {Mat4} 単位化した行列
         */
        static identity(dest){
            dest[0]  = 1; dest[1]  = 0; dest[2]  = 0; dest[3]  = 0;
            dest[4]  = 0; dest[5]  = 1; dest[6]  = 0; dest[7]  = 0;
            dest[8]  = 0; dest[9]  = 0; dest[10] = 1; dest[11] = 0;
            dest[12] = 0; dest[13] = 0; dest[14] = 0; dest[15] = 1;
            return dest;
        }
        /**
         * 行列を乗算する（参照に注意・戻り値としても結果を返す）
         * @param {Mat4} mat0 - 乗算される行列
         * @param {Mat4} mat1 - 乗算する行列
         * @param {Mat4} [dest] - 乗算結果を格納する行列
         * @return {Mat4} 乗算結果の行列
         */
        static multiply(mat0, mat1, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            let a = mat0[0],  b = mat0[1],  c = mat0[2],  d = mat0[3],
              e = mat0[4],  f = mat0[5],  g = mat0[6],  h = mat0[7],
              i = mat0[8],  j = mat0[9],  k = mat0[10], l = mat0[11],
              m = mat0[12], n = mat0[13], o = mat0[14], p = mat0[15],
              A = mat1[0],  B = mat1[1],  C = mat1[2],  D = mat1[3],
              E = mat1[4],  F = mat1[5],  G = mat1[6],  H = mat1[7],
              I = mat1[8],  J = mat1[9],  K = mat1[10], L = mat1[11],
              M = mat1[12], N = mat1[13], O = mat1[14], P = mat1[15];
            out[0]  = A * a + B * e + C * i + D * m;
            out[1]  = A * b + B * f + C * j + D * n;
            out[2]  = A * c + B * g + C * k + D * o;
            out[3]  = A * d + B * h + C * l + D * p;
            out[4]  = E * a + F * e + G * i + H * m;
            out[5]  = E * b + F * f + G * j + H * n;
            out[6]  = E * c + F * g + G * k + H * o;
            out[7]  = E * d + F * h + G * l + H * p;
            out[8]  = I * a + J * e + K * i + L * m;
            out[9]  = I * b + J * f + K * j + L * n;
            out[10] = I * c + J * g + K * k + L * o;
            out[11] = I * d + J * h + K * l + L * p;
            out[12] = M * a + N * e + O * i + P * m;
            out[13] = M * b + N * f + O * j + P * n;
            out[14] = M * c + N * g + O * k + P * o;
            out[15] = M * d + N * h + O * l + P * p;
            return out;
        }
        /**
         * 行列に拡大縮小を適用する（参照に注意・戻り値としても結果を返す）
         * @param {Mat4} mat - 適用を受ける行列
         * @param {Vec3} vec - XYZ の各軸に対して拡縮を適用する値の行列
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static scale(mat, vec, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            out[0]  = mat[0]  * vec[0];
            out[1]  = mat[1]  * vec[0];
            out[2]  = mat[2]  * vec[0];
            out[3]  = mat[3]  * vec[0];
            out[4]  = mat[4]  * vec[1];
            out[5]  = mat[5]  * vec[1];
            out[6]  = mat[6]  * vec[1];
            out[7]  = mat[7]  * vec[1];
            out[8]  = mat[8]  * vec[2];
            out[9]  = mat[9]  * vec[2];
            out[10] = mat[10] * vec[2];
            out[11] = mat[11] * vec[2];
            out[12] = mat[12];
            out[13] = mat[13];
            out[14] = mat[14];
            out[15] = mat[15];
            return out;
        }
        /**
         * 行列に平行移動を適用する（参照に注意・戻り値としても結果を返す）
         * @param {Mat4} mat - 適用を受ける行列
         * @param {Vec3} vec - XYZ の各軸に対して平行移動を適用する値の行列
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static translate(mat, vec, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            out[0] = mat[0]; out[1] = mat[1]; out[2]  = mat[2];  out[3]  = mat[3];
            out[4] = mat[4]; out[5] = mat[5]; out[6]  = mat[6];  out[7]  = mat[7];
            out[8] = mat[8]; out[9] = mat[9]; out[10] = mat[10]; out[11] = mat[11];
            out[12] = mat[0] * vec[0] + mat[4] * vec[1] + mat[8]  * vec[2] + mat[12];
            out[13] = mat[1] * vec[0] + mat[5] * vec[1] + mat[9]  * vec[2] + mat[13];
            out[14] = mat[2] * vec[0] + mat[6] * vec[1] + mat[10] * vec[2] + mat[14];
            out[15] = mat[3] * vec[0] + mat[7] * vec[1] + mat[11] * vec[2] + mat[15];
            return out;
        }
        /**
         * 行列に回転を適用する（参照に注意・戻り値としても結果を返す）
         * @param {Mat4} mat - 適用を受ける行列
         * @param {number} angle - 回転量を表す値（ラジアン）
         * @param {Vec3} axis - 回転の軸
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static rotate(mat, angle, axis, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            let sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
            if(!sq){return null;}
            let a = axis[0], b = axis[1], c = axis[2];
            if(sq != 1){sq = 1 / sq; a *= sq; b *= sq; c *= sq;}
            let d = Math.sin(angle), e = Math.cos(angle), f = 1 - e,
              g = mat[0],  h = mat[1], i = mat[2],  j = mat[3],
              k = mat[4],  l = mat[5], m = mat[6],  n = mat[7],
              o = mat[8],  p = mat[9], q = mat[10], r = mat[11],
              s = a * a * f + e,
              t = b * a * f + c * d,
              u = c * a * f - b * d,
              v = a * b * f - c * d,
              w = b * b * f + e,
              x = c * b * f + a * d,
              y = a * c * f + b * d,
              z = b * c * f - a * d,
              A = c * c * f + e;
            if(angle){
                if(mat != out){
                    out[12] = mat[12]; out[13] = mat[13];
                    out[14] = mat[14]; out[15] = mat[15];
                }
            } else {
                out = mat;
            }
            out[0]  = g * s + k * t + o * u;
            out[1]  = h * s + l * t + p * u;
            out[2]  = i * s + m * t + q * u;
            out[3]  = j * s + n * t + r * u;
            out[4]  = g * v + k * w + o * x;
            out[5]  = h * v + l * w + p * x;
            out[6]  = i * v + m * w + q * x;
            out[7]  = j * v + n * w + r * x;
            out[8]  = g * y + k * z + o * A;
            out[9]  = h * y + l * z + p * A;
            out[10] = i * y + m * z + q * A;
            out[11] = j * y + n * z + r * A;
            return out;
        }
        /**
         * ビュー座標変換行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {Vec3} eye - 視点位置
         * @param {Vec3} center - 注視点
         * @param {Vec3} up - 上方向を示すベクトル
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static lookAt(eye, center, up, dest){
            let eyeX    = eye[0],    eyeY    = eye[1],    eyeZ    = eye[2],
              centerX = center[0], centerY = center[1], centerZ = center[2],
              upX     = up[0],     upY     = up[1],     upZ     = up[2];
            if(eyeX == centerX && eyeY == centerY && eyeZ == centerZ){return Mat4.identity(dest);}
            let out = dest;
            if(dest == null){out = Mat4.create();}
            let x0, x1, x2, y0, y1, y2, z0, z1, z2, l;
            z0 = eyeX - center[0]; z1 = eyeY - center[1]; z2 = eyeZ - center[2];
            l = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
            z0 *= l; z1 *= l; z2 *= l;
            x0 = upY * z2 - upZ * z1;
            x1 = upZ * z0 - upX * z2;
            x2 = upX * z1 - upY * z0;
            l = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
            if(!l){
                x0 = 0; x1 = 0; x2 = 0;
            } else {
                l = 1 / l;
                x0 *= l; x1 *= l; x2 *= l;
            }
            y0 = z1 * x2 - z2 * x1; y1 = z2 * x0 - z0 * x2; y2 = z0 * x1 - z1 * x0;
            l = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
            if(!l){
                y0 = 0; y1 = 0; y2 = 0;
            } else {
                l = 1 / l;
                y0 *= l; y1 *= l; y2 *= l;
            }
            out[0] = x0; out[1] = y0; out[2]  = z0; out[3]  = 0;
            out[4] = x1; out[5] = y1; out[6]  = z1; out[7]  = 0;
            out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
            out[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
            out[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
            out[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
            out[15] = 1;
            return out;
        }
        /**
         * 透視投影変換行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {number} fovy - 視野角（度数法）
         * @param {number} aspect - アスペクト比（幅 / 高さ）
         * @param {number} near - ニアクリップ面までの距離
         * @param {number} far - ファークリップ面までの距離
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static perspective(fovy, aspect, near, far, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            let t = near * Math.tan(fovy * Math.PI / 360);
            let r = t * aspect;
            let a = r * 2, b = t * 2, c = far - near;
            out[0]  = near * 2 / a;
            out[1]  = 0;
            out[2]  = 0;
            out[3]  = 0;
            out[4]  = 0;
            out[5]  = near * 2 / b;
            out[6]  = 0;
            out[7]  = 0;
            out[8]  = 0;
            out[9]  = 0;
            out[10] = -(far + near) / c;
            out[11] = -1;
            out[12] = 0;
            out[13] = 0;
            out[14] = -(far * near * 2) / c;
            out[15] = 0;
            return out;
        }
        /**
         * 正射影投影変換行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {number} left - 左端
         * @param {number} right - 右端
         * @param {number} top - 上端
         * @param {number} bottom - 下端
         * @param {number} near - ニアクリップ面までの距離
         * @param {number} far - ファークリップ面までの距離
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static ortho(left, right, top, bottom, near, far, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            let h = (right - left);
            let v = (top - bottom);
            let d = (far - near);
            out[0]  = 2 / h;
            out[1]  = 0;
            out[2]  = 0;
            out[3]  = 0;
            out[4]  = 0;
            out[5]  = 2 / v;
            out[6]  = 0;
            out[7]  = 0;
            out[8]  = 0;
            out[9]  = 0;
            out[10] = -2 / d;
            out[11] = 0;
            out[12] = -(left + right) / h;
            out[13] = -(top + bottom) / v;
            out[14] = -(far + near) / d;
            out[15] = 1;
            return out;
        }
        /**
         * 転置行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {Mat4} mat - 適用する行列
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static transpose(mat, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            out[0]  = mat[0];  out[1]  = mat[4];
            out[2]  = mat[8];  out[3]  = mat[12];
            out[4]  = mat[1];  out[5]  = mat[5];
            out[6]  = mat[9];  out[7]  = mat[13];
            out[8]  = mat[2];  out[9]  = mat[6];
            out[10] = mat[10]; out[11] = mat[14];
            out[12] = mat[3];  out[13] = mat[7];
            out[14] = mat[11]; out[15] = mat[15];
            return out;
        }
        /**
         * 逆行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {Mat4} mat - 適用する行列
         * @param {Mat4} [dest] - 結果を格納する行列
         * @return {Mat4} 結果の行列
         */
        static inverse(mat, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            let a = mat[0],  b = mat[1],  c = mat[2],  d = mat[3],
              e = mat[4],  f = mat[5],  g = mat[6],  h = mat[7],
              i = mat[8],  j = mat[9],  k = mat[10], l = mat[11],
              m = mat[12], n = mat[13], o = mat[14], p = mat[15],
              q = a * f - b * e, r = a * g - c * e,
              s = a * h - d * e, t = b * g - c * f,
              u = b * h - d * f, v = c * h - d * g,
              w = i * n - j * m, x = i * o - k * m,
              y = i * p - l * m, z = j * o - k * n,
              A = j * p - l * n, B = k * p - l * o,
              ivd = 1 / (q * B - r * A + s * z + t * y - u * x + v * w);
            out[0]  = ( f * B - g * A + h * z) * ivd;
            out[1]  = (-b * B + c * A - d * z) * ivd;
            out[2]  = ( n * v - o * u + p * t) * ivd;
            out[3]  = (-j * v + k * u - l * t) * ivd;
            out[4]  = (-e * B + g * y - h * x) * ivd;
            out[5]  = ( a * B - c * y + d * x) * ivd;
            out[6]  = (-m * v + o * s - p * r) * ivd;
            out[7]  = ( i * v - k * s + l * r) * ivd;
            out[8]  = ( e * A - f * y + h * w) * ivd;
            out[9]  = (-a * A + b * y - d * w) * ivd;
            out[10] = ( m * u - n * s + p * q) * ivd;
            out[11] = (-i * u + j * s - l * q) * ivd;
            out[12] = (-e * z + f * x - g * w) * ivd;
            out[13] = ( a * z - b * x + c * w) * ivd;
            out[14] = (-m * t + n * r - o * q) * ivd;
            out[15] = ( i * t - j * r + k * q) * ivd;
            return out;
        }
        /**
         * 行列にベクトルを乗算する（ベクトルに行列を適用する）
         * @param {Mat4} mat - 適用する行列
         * @param {Array.<number>} vec - 乗算するベクトル（4 つの要素を持つ配列）
         * @return {Float32Array} 結果のベクトル
         */
        static toVecIV(mat, vec){
            let a = mat[0],  b = mat[1],  c = mat[2],  d = mat[3],
              e = mat[4],  f = mat[5],  g = mat[6],  h = mat[7],
              i = mat[8],  j = mat[9],  k = mat[10], l = mat[11],
              m = mat[12], n = mat[13], o = mat[14], p = mat[15];
            let x = vec[0], y = vec[1], z = vec[2], w = vec[3];
            let out = [];
            out[0] = x * a + y * e + z * i + w * m;
            out[1] = x * b + y * f + z * j + w * n;
            out[2] = x * c + y * g + z * k + w * o;
            out[3] = x * d + y * h + z * l + w * p;
            vec = out;
            return out;
        }
        /**
         * カメラのプロパティに相当する情報を受け取り行列を生成する
         * @param {Vec3} position - カメラの座標
         * @param {Vec3} centerPoint - カメラの注視点
         * @param {Vec3} upDirection - カメラの上方向
         * @param {number} fovy - 視野角
         * @param {number} aspect - アスペクト比
         * @param {number} near - ニアクリップ面
         * @param {number} far - ファークリップ面
         * @param {Mat4} vmat - ビュー座標変換行列の結果を格納する行列
         * @param {Mat4} pmat - 透視投影座標変換行列の結果を格納する行列
         * @param {Mat4} dest - ビュー x 透視投影変換行列の結果を格納する行列
         */
        static vpFromCameraProperty(position, centerPoint, upDirection, fovy, aspect, near, far, vmat, pmat, dest){
            Mat4.lookAt(position, centerPoint, upDirection, vmat);
            Mat4.perspective(fovy, aspect, near, far, pmat);
            Mat4.multiply(pmat, vmat, dest);
        }
        /**
         * MVP 行列に相当する行列を受け取りベクトルを変換して返す
         * @param {Mat4} mat - MVP 行列
         * @param {Array.<number>} vec - MVP 行列と乗算するベクトル
         * @param {number} width - ビューポートの幅
         * @param {number} height - ビューポートの高さ
         * @return {Array.<number>} 結果のベクトル（2 つの要素を持つベクトル）
         */
        static screenPositionFromMvp(mat, vec, width, height){
            let halfWidth = width * 0.5;
            let halfHeight = height * 0.5;
            let v = Mat4.toVecIV(mat, [vec[0], vec[1], vec[2], 1.0]);
            if(v[3] <= 0.0){return [NaN, NaN];}
            v[0] /= v[3]; v[1] /= v[3]; v[2] /= v[3];
            return [
                halfWidth + v[0] * halfWidth,
                halfHeight - v[1] * halfHeight
            ];
        }
    }

    /**
     * Vec3
     * @class Vec3
     */
    class Vec3 {
        /**
         * 3 つの要素を持つベクトルを生成する
         * @return {Float32Array} ベクトル格納用の配列
         */
        static create(){
            return new Float32Array(3);
        }
        /**
         * ベクトルの長さ（大きさ）を返す
         * @param {Vec3} v - 3 つの要素を持つベクトル
         * @return {number} ベクトルの長さ（大きさ）
         */
        static len(v){
            return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        }
        /**
         * 2 つの座標（始点・終点）を結ぶベクトルを返す
         * @param {Vec3} v0 - 3 つの要素を持つ始点座標
         * @param {Vec3} v1 - 3 つの要素を持つ終点座標
         * @return {Vec3} 視点と終点を結ぶベクトル
         */
        static distance(v0, v1){
            let n = Vec3.create();
            n[0] = v1[0] - v0[0];
            n[1] = v1[1] - v0[1];
            n[2] = v1[2] - v0[2];
            return n;
        }
        /**
         * ベクトルを正規化した結果を返す
         * @param {Vec3} v - 3 つの要素を持つベクトル
         * @return {Vec3} 正規化したベクトル
         */
        static normalize(v){
            let n = Vec3.create();
            let l = Vec3.len(v);
            if(l > 0){
                let e = 1.0 / l;
                n[0] = v[0] * e;
                n[1] = v[1] * e;
                n[2] = v[2] * e;
            }else {
                n[0] = 0.0;
                n[1] = 0.0;
                n[2] = 0.0;
            }
            return n;
        }
        /**
         * 2 つのベクトルの内積の結果を返す
         * @param {Vec3} v0 - 3 つの要素を持つベクトル
         * @param {Vec3} v1 - 3 つの要素を持つベクトル
         * @return {number} 内積の結果
         */
        static dot(v0, v1){
            return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
        }
        /**
         * 2 つのベクトルの外積の結果を返す
         * @param {Vec3} v0 - 3 つの要素を持つベクトル
         * @param {Vec3} v1 - 3 つの要素を持つベクトル
         * @return {Vec3} 外積の結果
         */
        static cross(v0, v1){
            let n = Vec3.create();
            n[0] = v0[1] * v1[2] - v0[2] * v1[1];
            n[1] = v0[2] * v1[0] - v0[0] * v1[2];
            n[2] = v0[0] * v1[1] - v0[1] * v1[0];
            return n;
        }
        /**
         * 3 つのベクトルから面法線を求めて返す
         * @param {Vec3} v0 - 3 つの要素を持つベクトル
         * @param {Vec3} v1 - 3 つの要素を持つベクトル
         * @param {Vec3} v2 - 3 つの要素を持つベクトル
         * @return {Vec3} 面法線ベクトル
         */
        static faceNormal(v0, v1, v2){
            let n = Vec3.create();
            let vec1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
            let vec2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
            n[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
            n[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
            n[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];
            return Vec3.normalize(n);
        }
    }

    /**
     * Vec2
     * @class Vec2
     */
    class Vec2 {
        /**
         * 2 つの要素を持つベクトルを生成する
         * @return {Float32Array} ベクトル格納用の配列
         */
        static create(){
            return new Float32Array(2);
        }
        /**
         * ベクトルの長さ（大きさ）を返す
         * @param {Vec2} v - 2 つの要素を持つベクトル
         * @return {number} ベクトルの長さ（大きさ）
         */
        static len(v){
            return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        }
        /**
         * 2 つの座標（始点・終点）を結ぶベクトルを返す
         * @param {Vec2} v0 - 2 つの要素を持つ始点座標
         * @param {Vec2} v1 - 2 つの要素を持つ終点座標
         * @return {Vec2} 視点と終点を結ぶベクトル
         */
        static distance(v0, v1){
            let n = Vec2.create();
            n[0] = v1[0] - v0[0];
            n[1] = v1[1] - v0[1];
            return n;
        }
        /**
         * ベクトルを正規化した結果を返す
         * @param {Vec2} v - 2 つの要素を持つベクトル
         * @return {Vec2} 正規化したベクトル
         */
        static normalize(v){
            let n = Vec2.create();
            let l = Vec2.len(v);
            if(l > 0){
                let e = 1.0 / l;
                n[0] = v[0] * e;
                n[1] = v[1] * e;
            }
            return n;
        }
        /**
         * 2 つのベクトルの内積の結果を返す
         * @param {Vec2} v0 - 2 つの要素を持つベクトル
         * @param {Vec2} v1 - 2 つの要素を持つベクトル
         * @return {number} 内積の結果
         */
        static dot(v0, v1){
            return v0[0] * v1[0] + v0[1] * v1[1];
        }
        /**
         * 2 つのベクトルの外積の結果を返す
         * @param {Vec2} v0 - 2 つの要素を持つベクトル
         * @param {Vec2} v1 - 2 つの要素を持つベクトル
         * @return {Vec2} 外積の結果
         */
        static cross(v0, v1){
            Vec2.create();
            return v0[0] * v1[1] - v0[1] * v1[0];
        }
    }

    /**
     * Qtn
     * @class Qtn
     */
    class Qtn {
        /**
         * 4 つの要素からなるクォータニオンのデータ構造を生成する（虚部 x, y, z, 実部 w の順序で定義）
         * @return {Float32Array} クォータニオンデータ格納用の配列
         */
        static create(){
            return new Float32Array(4);
        }
        /**
         * クォータニオンを初期化する（参照に注意）
         * @param {Qtn} dest - 初期化するクォータニオン
         * @return {Qtn} 結果のクォータニオン
         */
        static identity(dest){
            dest[0] = 0; dest[1] = 0; dest[2] = 0; dest[3] = 1;
            return dest;
        }
        /**
         * 共役四元数を生成して返す（参照に注意・戻り値としても結果を返す）
         * @param {Qtn} qtn - 元となるクォータニオン
         * @param {Qtn} [dest] - 結果を格納するクォータニオン
         * @return {Qtn} 結果のクォータニオン
         */
        static inverse(qtn, dest){
            let out = dest;
            if(dest == null){out = Qtn.create();}
            out[0] = -qtn[0];
            out[1] = -qtn[1];
            out[2] = -qtn[2];
            out[3] =  qtn[3];
            return out;
        }
        /**
         * 虚部を正規化して返す（参照に注意）
         * @param {Qtn} qtn - 元となるクォータニオン
         * @return {Qtn} 結果のクォータニオン
         */
        static normalize(dest){
            let x = dest[0], y = dest[1], z = dest[2];
            let l = Math.sqrt(x * x + y * y + z * z);
            if(l === 0){
                dest[0] = 0;
                dest[1] = 0;
                dest[2] = 0;
            }else {
                l = 1 / l;
                dest[0] = x * l;
                dest[1] = y * l;
                dest[2] = z * l;
            }
            return dest;
        }
        /**
         * クォータニオンを乗算した結果を返す（参照に注意・戻り値としても結果を返す）
         * @param {Qtn} qtn0 - 乗算されるクォータニオン
         * @param {Qtn} qtn1 - 乗算するクォータニオン
         * @param {Qtn} [dest] - 結果を格納するクォータニオン
         * @return {Qtn} 結果のクォータニオン
         */
        static multiply(qtn0, qtn1, dest){
            let out = dest;
            if(dest == null){out = Qtn.create();}
            let ax = qtn0[0], ay = qtn0[1], az = qtn0[2], aw = qtn0[3];
            let bx = qtn1[0], by = qtn1[1], bz = qtn1[2], bw = qtn1[3];
            out[0] = ax * bw + aw * bx + ay * bz - az * by;
            out[1] = ay * bw + aw * by + az * bx - ax * bz;
            out[2] = az * bw + aw * bz + ax * by - ay * bx;
            out[3] = aw * bw - ax * bx - ay * by - az * bz;
            return out;
        }
        /**
         * クォータニオンに回転を適用し返す（参照に注意・戻り値としても結果を返す）
         * @param {number} angle - 回転する量（ラジアン）
         * @param {Array.<number>} axis - 3 つの要素を持つ軸ベクトル
         * @param {Qtn} [dest] - 結果を格納するクォータニオン
         * @return {Qtn} 結果のクォータニオン
         */
        static rotate(angle, axis, dest){
            let out = dest;
            if(dest == null){out = Qtn.create();}
            let a = axis[0], b = axis[1], c = axis[2];
            let sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
            if(sq !== 0){
                let l = 1 / sq;
                a *= l;
                b *= l;
                c *= l;
            }
            let s = Math.sin(angle * 0.5);
            out[0] = a * s;
            out[1] = b * s;
            out[2] = c * s;
            out[3] = Math.cos(angle * 0.5);
            return out;
        }
        /**
         * ベクトルにクォータニオンを適用し返す（参照に注意・戻り値としても結果を返す）
         * @param {Array.<number>} vec - 3 つの要素を持つベクトル
         * @param {Qtn} qtn - クォータニオン
         * @param {Array.<number>} [dest] - 3 つの要素を持つベクトル
         * @return {Array.<number>} 結果のベクトル
         */
        static toVecIII(vec, qtn, dest){
            let out = dest;
            if(dest == null){out = [0.0, 0.0, 0.0];}
            let qp = Qtn.create();
            let qq = Qtn.create();
            let qr = Qtn.create();
            Qtn.inverse(qtn, qr);
            qp[0] = vec[0];
            qp[1] = vec[1];
            qp[2] = vec[2];
            Qtn.multiply(qr, qp, qq);
            Qtn.multiply(qq, qtn, qr);
            out[0] = qr[0];
            out[1] = qr[1];
            out[2] = qr[2];
            return out;
        }
        /**
         * 4x4 行列にクォータニオンを適用し返す（参照に注意・戻り値としても結果を返す）
         * @param {Qtn} qtn - クォータニオン
         * @param {Mat4} [dest] - 4x4 行列
         * @return {Mat4} 結果の行列
         */
        static toMatIV(qtn, dest){
            let out = dest;
            if(dest == null){out = Mat4.create();}
            let x = qtn[0], y = qtn[1], z = qtn[2], w = qtn[3];
            let x2 = x + x, y2 = y + y, z2 = z + z;
            let xx = x * x2, xy = x * y2, xz = x * z2;
            let yy = y * y2, yz = y * z2, zz = z * z2;
            let wx = w * x2, wy = w * y2, wz = w * z2;
            out[0]  = 1 - (yy + zz);
            out[1]  = xy - wz;
            out[2]  = xz + wy;
            out[3]  = 0;
            out[4]  = xy + wz;
            out[5]  = 1 - (xx + zz);
            out[6]  = yz - wx;
            out[7]  = 0;
            out[8]  = xz - wy;
            out[9]  = yz + wx;
            out[10] = 1 - (xx + yy);
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 1;
            return out;
        }
        /**
         * 2 つのクォータニオンの球面線形補間を行った結果を返す（参照に注意・戻り値としても結果を返す）
         * @param {Qtn} qtn0 - クォータニオン
         * @param {Qtn} qtn1 - クォータニオン
         * @param {number} time - 補間係数（0.0 から 1.0 で指定）
         * @param {Qtn} [dest] - 結果を格納するクォータニオン
         * @return {Qtn} 結果のクォータニオン
         */
        static slerp(qtn0, qtn1, time, dest){
            let out = dest;
            if(dest == null){out = Qtn.create();}
            let ht = qtn0[0] * qtn1[0] + qtn0[1] * qtn1[1] + qtn0[2] * qtn1[2] + qtn0[3] * qtn1[3];
            let hs = 1.0 - ht * ht;
            if(hs <= 0.0){
                out[0] = qtn0[0];
                out[1] = qtn0[1];
                out[2] = qtn0[2];
                out[3] = qtn0[3];
            }else {
                hs = Math.sqrt(hs);
                if(Math.abs(hs) < 0.0001){
                    out[0] = (qtn0[0] * 0.5 + qtn1[0] * 0.5);
                    out[1] = (qtn0[1] * 0.5 + qtn1[1] * 0.5);
                    out[2] = (qtn0[2] * 0.5 + qtn1[2] * 0.5);
                    out[3] = (qtn0[3] * 0.5 + qtn1[3] * 0.5);
                }else {
                    let ph = Math.acos(ht);
                    let pt = ph * time;
                    let t0 = Math.sin(ph - pt) / hs;
                    let t1 = Math.sin(pt) / hs;
                    out[0] = qtn0[0] * t0 + qtn1[0] * t1;
                    out[1] = qtn0[1] * t0 + qtn1[1] * t1;
                    out[2] = qtn0[2] * t0 + qtn1[2] * t1;
                    out[3] = qtn0[3] * t0 + qtn1[3] * t1;
                }
            }
            return out;
        }
    }

    /**
     * ジオメトリ情報を生成する
     * @class
     */
    class WebGLGeometry {
        /**
         * 板ポリゴンの頂点情報を生成する
         * @param {number} width - 板ポリゴンの一辺の幅
         * @param {number} height - 板ポリゴンの一辺の高さ
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let planeData = WebGLGeometry.plane(2.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
         */
        static plane(width, height, color){
            let w, h;
            w = width / 2;
            h = height / 2;
            let pos = [
                -w,  h,  0.0,
                w,  h,  0.0,
                -w, -h,  0.0,
                w, -h,  0.0
            ];
            let nor = [
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0
            ];
            let col = [
                color[0], color[1], color[2], color[3],
                color[0], color[1], color[2], color[3],
                color[0], color[1], color[2], color[3],
                color[0], color[1], color[2], color[3]
            ];
            let st  = [
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                1.0, 1.0
            ];
            let idx = [
                0, 2, 1,
                1, 2, 3
            ];
            return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
        }

        /**
         * 円（XY 平面展開）の頂点情報を生成する
         * @param {number} split - 円の円周の分割数
         * @param {number} rad - 円の半径
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let circleData = WebGLGeometry.circle(64, 1.0, [1.0, 1.0, 1.0, 1.0]);
         */
        static circle(split, rad, color){
            let i, j = 0;
            let pos = [], nor = [],
              col = [], st  = [], idx = [];
            pos.push(0.0, 0.0, 0.0);
            nor.push(0.0, 0.0, 1.0);
            col.push(color[0], color[1], color[2], color[3]);
            st.push(0.5, 0.5);
            for(i = 0; i < split; i++){
                let r = Math.PI * 2.0 / split * i;
                let rx = Math.cos(r);
                let ry = Math.sin(r);
                pos.push(rx * rad, ry * rad, 0.0);
                nor.push(0.0, 0.0, 1.0);
                col.push(color[0], color[1], color[2], color[3]);
                st.push((rx + 1.0) * 0.5, 1.0 - (ry + 1.0) * 0.5);
                if(i === split - 1){
                    idx.push(0, j + 1, 1);
                }else {
                    idx.push(0, j + 1, j + 2);
                }
                ++j;
            }
            return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
        }

        /**
         * キューブの頂点情報を生成する
         * @param {number} side - 正立方体の一辺の長さ
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線 ※キューブの中心から各頂点に向かって伸びるベクトルなので注意
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let cubeData = WebGLGeometry.cube(2.0, [1.0, 1.0, 1.0, 1.0]);
         */
        static cube(side, color){
            let hs = side * 0.5;
            let pos = [
                -hs, -hs,  hs,  hs, -hs,  hs,  hs,  hs,  hs, -hs,  hs,  hs,
                -hs, -hs, -hs, -hs,  hs, -hs,  hs,  hs, -hs,  hs, -hs, -hs,
                -hs,  hs, -hs, -hs,  hs,  hs,  hs,  hs,  hs,  hs,  hs, -hs,
                -hs, -hs, -hs,  hs, -hs, -hs,  hs, -hs,  hs, -hs, -hs,  hs,
                hs, -hs, -hs,  hs,  hs, -hs,  hs,  hs,  hs,  hs, -hs,  hs,
                -hs, -hs, -hs, -hs, -hs,  hs, -hs,  hs,  hs, -hs,  hs, -hs
            ];
            let v = 1.0 / Math.sqrt(3.0);
            let nor = [
                -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
                -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
                -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
                -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
                v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
                -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
            ];
            let col = [];
            for(let i = 0; i < pos.length / 3; i++){
                col.push(color[0], color[1], color[2], color[3]);
            }
            let st = [
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
            ];
            let idx = [
                0,  1,  2,  0,  2,  3,
                4,  5,  6,  4,  6,  7,
                8,  9, 10,  8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23
            ];
            return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
        }

        static box(width, height, depth, color){
            let hw = width * 0.5;
            let hh = height * 0.5;
            let hd = depth * 0.5;
            let pos = [
                -hw, -hh,  hd, // 左下前
                hw, -hh,  hd, // 右下前
                hw,  hh,  hd, // 右上前
                -hw,  hh,  hd, // 左上前
                -hw, -hh, -hd, // 左下奥
                -hw,  hh, -hd, // 左上奥
                hw,  hh, -hd, // 右上奥
                hw, -hh, -hd, // 右下奥
                -hw,  hh, -hd, // 左上奥
                -hw,  hh,  hd, // 左上前
                hw,  hh,  hd, // 右上前
                hw,  hh, -hd, // 右上奥
                -hw, -hh, -hd, // 左下奥
                hw, -hh, -hd, // 右下奥
                hw, -hh,  hd, // 右下前
                -hw, -hh,  hd, // 左下前
                hw, -hh, -hd, // 右下奥
                hw,  hh, -hd, // 右上奥
                hw,  hh,  hd, // 右上前
                hw, -hh,  hd, // 右下前
                -hw, -hh, -hd, // 左下奥
                -hw, -hh,  hd, // 左下前
                -hw,  hh,  hd, // 左上前
                -hw,  hh, -hd // 左上奥
            ];
            let v = 1.0 / Math.sqrt(3.0);
            let nor = [
                -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
                -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
                -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
                -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
                v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
                -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
            ];
            let col = [];
            for(let i = 0; i < pos.length / 3; i++){
                col.push(color[0], color[1], color[2], color[3]);
            }
            let st = [
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
            ];
            let idx = [
                0,  1,  2,  0,  2,  3,
                4,  5,  6,  4,  6,  7,
                8,  9, 10,  8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23
            ];
            return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
        }

        // TODO: 命名変更
        static boxLine(width, height, depth, color){
            let hw = width * 0.5;
            let hh = height * 0.5;
            let hd = depth * 0.5;
            let pos = [
                // 前面
                -hw, -hh,  hd, // 左下前
                hw, -hh,  hd, // 右下前
                hw, -hh,  hd, // 右下前
                hw,  hh,  hd, // 右上前
                hw,  hh,  hd, // 右上前
                -hw,  hh,  hd, // 左上前
                -hw,  hh,  hd, // 左上前
                -hw, -hh,  hd, // 左下前
                // 奥面
                -hw, -hh, -hd, // 左下奥
                -hw,  hh, -hd, // 左上奥
                -hw,  hh, -hd, // 左上奥
                hw,  hh, -hd, // 右上奥
                hw,  hh, -hd, // 右上奥
                hw, -hh, -hd, // 右下奥
                hw, -hh, -hd, // 右下奥
                -hw, -hh, -hd, // 左下奥
                // 天井
                -hw,  hh, -hd, // 左上奥
                -hw,  hh,  hd, // 左上前
                -hw,  hh,  hd, // 左上前
                hw,  hh,  hd, // 右上前
                hw,  hh,  hd, // 右上前
                hw,  hh, -hd, // 右上奥
                hw,  hh, -hd, // 右上奥
                -hw,  hh, -hd, // 左上奥
                // 下面
                -hw, -hh, -hd, // 左下奥
                hw, -hh, -hd, // 右下奥
                hw, -hh, -hd, // 右下奥
                hw, -hh,  hd, // 右下前
                hw, -hh,  hd, // 右下前
                -hw, -hh,  hd, // 左下前
                -hw, -hh,  hd, // 左下前
                -hw, -hh, -hd, // 左下奥
                // 右面
                hw, -hh, -hd, // 右下奥
                hw,  hh, -hd, // 右上奥
                hw,  hh, -hd, // 右上奥
                hw,  hh,  hd, // 右上前
                hw,  hh,  hd, // 右上前
                hw, -hh,  hd, // 右下前
                hw, -hh,  hd, // 右下前
                hw, -hh, -hd, // 右下奥
                // 左面
                -hw, -hh, -hd, // 左下奥
                -hw, -hh,  hd, // 左下前
                -hw, -hh,  hd, // 左下前
                -hw,  hh,  hd, // 左上前
                -hw,  hh,  hd, // 左上前
                -hw,  hh, -hd // 左上奥
                // -hw,  hh, -hd // 左上奥
                // -hw, -hh, -hd, // 左下奥
            ];

            let col = [];
            for(let i = 0; i < pos.length / 3; i++){
                col.push(color[0], color[1], color[2], color[3]);
            }
            return {position: pos, color: col}
        }

        static axis(size, color){
            let pos = [size * -1, 0.0, 0.0, size, 0.0, 0.0, 0.0, size * -1, 0.0, 0.0, size, 0.0, 0.0, 0.0, size, 0.0, 0.0, size * -1];
            let col = [
                0.45,
                0.45,
                0.45,
                1.0,
                0.45,
                0.45,
                0.45,
                1.0,
                0.45,
                0.45,
                0.45,
                1.0,
                0.45,
                0.45,
                0.45,
                1.0,
                0.45,
                0.45,
                0.45,
                1.0,
                0.45,
                0.45,
                0.45,
                1.0,
            ];
            return {position: pos, color: col}
        }
    }

    var t;!function(t){t[t.R=0]="R",t[t.G=1]="G",t[t.B=2]="B";}(t||(t={}));var e=function(t,e){this.imageData=t,this.options=e||{strict:!1},this.colors=this.__calculateColorCount(this.imageData.data),this.buckets=[],this.__bucketsPerStep=[];},n={roundingBits:{configurable:!0},palette:{configurable:!0},bucketsPerStep:{configurable:!0}};e.averageColor=function(t){for(var e=0,n=0,r=0,a=0,o=0,i=t.length;o<i;o=o+1|0){var s=t[o],h=s[0],c=s[1],u=s[2],l=s[3];n=h*l+n,r=c*l+r,a=u*l+a,e=e+l|0;}return [Math.round(n/e),Math.round(r/e),Math.round(a/e)]},n.roundingBits.get=function(){return this.options.strict?255:248},n.palette.get=function(){for(var t=[],n=0,r=this.buckets.length;n<r;n=n+1|0)t[n]=e.averageColor(this.buckets[n].colors);return t},n.bucketsPerStep.get=function(){return this.__bucketsPerStep},e.prototype.reduce=function(t){if(this.colors.length<=t)return console.warn("It has already been reduced color."),this.imageData;this.buckets=this.__mediancut([this.__generateBucket(this.colors)],t);for(var n=new Map,r=0,a=this.buckets.length;r<a;r=r+1|0)for(var o=this.buckets[r],i=e.averageColor(o.colors),s=0,h=o.colors.length;s<h;s=s+1|0){var c=o.colors[s],u=c[0],l=c[1],g=c[2],m=u&this.roundingBits|(l&this.roundingBits)<<8|(g&this.roundingBits)<<16;n.set(m,i);}for(var f=this.imageData.data,p=f.length,d=new Uint8ClampedArray(p),_=0;_<p;){var v=f[_]&this.roundingBits|(f[_+1]&this.roundingBits)<<8|(f[_+2]&this.roundingBits)<<16,B=n.get(v),b=B[0],k=B[1],x=B[2];d[_]=b,d[_+1]=k,d[_+2]=x,d[_+3]=f[_+3],_=_+4|0;}return new ImageData(d,this.imageData.width,this.imageData.height)},e.prototype.__calculateColorCount=function(t){for(var e=new Map,n=t.length,r=0;r<n;){var a=t[r]&this.roundingBits,o=t[r+1]&this.roundingBits,i=t[r+2]&this.roundingBits,s=a|o<<8|i<<16,h=e.get(s),c=h?h[3]+1:1;e.set(s,[a,o,i,c]),r=r+4|0;}var u=[];return e.forEach((function(t){u[u.length]=t;})),u},e.prototype.__getTotalAnGreatestRangeChannel=function(e){for(var n=0,r=0,a=0,o=0,i=255,s=255,h=255,c=e.length,u=0;u<c;){var l=e[u],g=l[0],m=l[1],f=l[2],p=l[3];r=Math.max(g,r),a=Math.max(m,a),o=Math.max(f,o),i=Math.min(g,i),s=Math.min(m,s),h=Math.min(f,h),n+=p,u=u+1|0;}var d=1.2*(r-i),_=1.2*(a-s),v=o-h,B=Math.max(d,_,v),b=t.R;return d===B&&(b=t.R),_===B&&(b=t.G),v===B&&(b=t.B),{total:n,channel:b,minR:i,minG:s,minB:h,maxR:r,maxG:a,maxB:o}},e.prototype.__mediancut=function(t,e){this.__bucketsPerStep.push([].concat(t));var n=0,r=0;if(t.length+1>e)return t;for(var a=0,o=t.length;a<o;a=a+1|0)t[a].total>n&&1!==t[a].colors.length&&(r=a,n=t[a].total);var i=t[r];if(1===i.total||1===i.colors.length)return console.error("Cube could not be split."),t;var s=i.channel;i.colors.sort((function(t,e){return t[s]-e[s]}));var h=Math.floor((i.colors.length+1)/2),c=this.__generateBucket(i.colors.slice(0,h)),u=this.__generateBucket(i.colors.slice(h));return t.splice(r,1,c,u),this.__mediancut(t,e)},e.prototype.__generateBucket=function(t){var e=this.__getTotalAnGreatestRangeChannel(t);return {colors:t,total:e.total,channel:e.channel,minR:e.minR,minG:e.minG,minB:e.minB,maxR:e.maxR,maxG:e.maxG,maxB:e.maxB}},Object.defineProperties(e.prototype,n);

    var p=class extends HTMLElement{constructor(i,t,a=!0){super();this.editing=!1;this.attachShadow({mode:"open"}),this.axes=i,this.totalTime=t,this.debug=a,this.shadowRoot.innerHTML=this.template(i,t),this.$pane=this.shadowRoot.querySelector("#pane"),this.$timeline=this.shadowRoot.querySelector("#timeline"),this.$current=this.shadowRoot.querySelector("#current"),this.$progress=this.shadowRoot.querySelector("#progress"),this.$labels=this.shadowRoot.querySelectorAll(".label"),this.$bars=this.shadowRoot.querySelectorAll(".bar"),this.$barsBegin=this.shadowRoot.querySelectorAll(".begin"),this.$barsEnd=this.shadowRoot.querySelectorAll(".end"),this.$previous=this.shadowRoot.querySelector("#previous"),this.$playPause=this.shadowRoot.querySelector("#play-pause"),this.$next=this.shadowRoot.querySelector("#next"),this.playing=!0,this.previous=!1,this.next=!1,this.skip=-1,this.$previous.addEventListener("click",e=>{this.previous=!0;}),this.$playPause.addEventListener("click",e=>{this.playing=!this.playing;}),this.$next.addEventListener("click",e=>{this.next=!0;});for(let e=0,n=this.$bars.length;e<n;e++){if(this.$bars[e].addEventListener("click",l=>{let o=l.currentTarget,h=Number(o.getAttribute("idx"));this.skip=h;}),!this.debug)continue;let r=this.$barsBegin[e],d=this.$barsEnd[e];r.addEventListener("input",l=>{let o=Number(r.value);if(Number(this.$barsEnd[e].value)<o){l.preventDefault();return}if(Number.isFinite(this.axes[e].position))this.axes[e].position=o,this.axes[e].duration=this.axes[e].endAt-(this.axes[e].delay+this.axes[e].position);else {let h=this.axes.find(c=>c.key===this.axes[e].position);this.axes[e].delay=o-h.endAt,this.axes[e].duration=this.axes[e].endAt-(this.axes[e].delay+h.endAt);}}),d.addEventListener("input",l=>{let o=Number(d.value);if(o<Number(this.$barsBegin[e].value)){l.preventDefault();return}if(Number.isFinite(this.axes[e].position))this.axes[e].duration=o-(this.axes[e].position+this.axes[e].delay);else {let h=this.axes.find(c=>c.key===this.axes[e].position);this.axes[e].duration=o-h.endAt-this.axes[e].delay;}});}this.$labels.forEach(e=>{e.addEventListener("click",n=>{let s=n.currentTarget,r=Number(s.getAttribute("idx"));this.skip=r;});}),this.$current.addEventListener("input",e=>{this.editing=!0;let n=Number(this.$current.value);this.__updateProgressPosition(n),this.__updateBar(this.totalTime);}),this.$current.addEventListener("change",e=>{this.editing=!1;});}attributeChangedCallback(){}connectedCallback(){}disconnectedCallback(){}getAxes(){return this.axes}get(i){let t=Date.now(),a=Number(this.$current.value),e=t-i;if(this.playing||(i=t-a,e=a),this.editing&&(i=t-a,e=a),-1<this.skip){let n=this.axes[this.skip];i=t-n.beginAt,e=n.beginAt,this.skip=-1;}return this.previous&&(this.previous=!1,i=t,e=0),this.next&&(this.next=!1,i=t-this.totalTime,e=this.totalTime),{beginAt:i,elapsedTime:e,editing:this.editing}}update(i,t,a){this.axes=a,this.totalTime=t,this.$current.setAttribute("max",t),this.$current.value=i,this.__updateProgressPosition(i),this.__updateBar(t),this.debug&&this.__updateBarRange(t),this.__updateScale(t);}template(i,t){let a="",e="",n="";for(let s=0;s<i.length;s++){let r=i[s];a+=`<div class="row" id="row-${s}"><div class="label" idx="${s}">${r.key}</div></div>`;let d="";this.debug&&(d=`
          <input class="begin" type="range" min="0" max="0" step="10" value="${r.beginAt}">
          <input class="end" type="range" min="0" max="0" step="10" value="${r.endAt}">
        `),e+=`
        <div class="row">
          <div class="bar bar--${this.debug?"debug":"default"}" idx="${s}"></div>
          ${d}
        </div>`,this.debug;}for(let s=0,r=Math.floor(t/1e3);s<r;s++)n+=`<div class="scale-label" style="--sec: ${s+1}">${s+1}s</div>`;return `
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
    `}__updateScale(i){let t=this.shadowRoot.querySelector(".test");t&&t.remove(),this.shadowRoot.querySelectorAll(".scale-label").forEach(s=>{s.remove();}),this.shadowRoot.querySelector(".scale").style.setProperty("--total",i);let e="";for(let s=0,r=Math.floor(i/1e3);s<r;s++)e+=`<div class="scale-label" style="--sec: ${s+1}">${s+1}s</div>`;let n=document.createElement("div");n.className="test",n.innerHTML=e,this.shadowRoot.querySelector(".scale").appendChild(n);}__updateProgressPosition(i){let t=this.$timeline.clientWidth,a=Math.min(i/this.totalTime,1)*t;this.$progress.style.transform=`translateX(${a}px)`;}__updateBarRange(i){for(let t=0;t<this.$bars.length;t++){let a=this.axes[t];this.$barsBegin[t].setAttribute("max",i),this.$barsBegin[t].value=a.beginAt,this.$barsEnd[t].setAttribute("max",i),this.$barsEnd[t].value=a.endAt;}}__updateBar(i){let a=this.$timeline.clientWidth/i;for(let e=0;e<this.$bars.length;e++){let n=this.axes[e],s=n.beginAt*a,r=(n.endAt-n.beginAt)*a;this.$bars[e].style.transform=`translateX(${s}px)`,this.$bars[e].style.width=`${r}px`,0<n.progress&&!n.pass?this.$bars[e].classList.add("bar--active"):this.$bars[e].classList.remove("bar--active");}}};window.customElements.define("taxis-timeline",p);var u={key:"",beginAt:0,endAt:0,duration:0,delay:0,position:0,progress:0,enter:!1,pass:!1};var g=class{constructor(i={}){this.option=i;this.axes=[];}get totalTime(){return this.axes.length?Math.max(...this.axes.map(i=>i.endAt)):0}get totalTimeForTimeline(){return this.totalTime+500}get everyPassed(){return this.axes.every(i=>i.pass)}restart(){this.beginAt=Date.now();}getAxis({key:i}){return this.axes.find(t=>t.key===i)}getAxes(){return this.axes}add(i,t,a=0,e){let n=this.totalTime+a;if(e!==void 0)Number.isFinite(e)?n=e+a:n=this.getAxis({key:e}).endAt+a;else {let s=this.axes[this.axes.length-1];e=s?s.key:0;}return this.axes.push({...u,key:i,beginAt:n,endAt:n+t,duration:t,delay:a,position:e}),this.sort(),this}begin(){this.option.timeline&&(this.timeline=new p(this.axes,this.totalTimeForTimeline,this.option.timeline.debug),this.option.timeline.container.appendChild(this.timeline)),this.beginAt=Date.now(),this.__tick();}reset(){cancelAnimationFrame(this.requestID);}ticker(i){this.tickerFn=i;}__tick(){let i=this.beginAt,t=Date.now()-i,a=!1;if(this.option.timeline){this.axes=this.recalculation(this.timeline.getAxes());let{beginAt:e,elapsedTime:n,editing:s}=this.timeline.get(this.beginAt);i=e,t=n,a=s;}this.beginAt=i,this.axes.forEach((e,n)=>{let s=t-e.beginAt,r=Math.max(0,Math.min(s/e.duration,1)),d=e.beginAt<=t,l=e.endAt<t;e.progress=r,e.enter=d,e.pass=l;}),this.option.timeline&&!a&&this.timeline.update(t,this.totalTimeForTimeline,this.axes),this.tickerFn&&this.tickerFn(t,this.toMap(this.axes)),this.requestID=requestAnimationFrame(this.__tick.bind(this));}calculation(){let i=[];for(let t=0;t<this.axes.length;t++){let a=this.axes[t],{key:e,duration:n,position:s,delay:r}=a,l=Math.max(...i.map(o=>o.endAt))+r;s!==void 0?Number.isFinite(s)?l=s+r:l=this.getAxis({key:s}).endAt+r:s=l,i.push({...u,key:e,beginAt:l,endAt:l+n,duration:n,delay:r,position:s});}}recalculation(i){let t=[];for(let a=0;a<i.length;a++){let e=i[a],{key:n,duration:s,position:r,delay:d}=e,o=Math.max(...t.map(h=>h.endAt))+d;r!==void 0?Number.isFinite(r)?o=r+d:o=this.getAxis({key:r}).endAt+d:r=o,t.push({...u,key:n,beginAt:o,endAt:o+s,duration:s,delay:d,position:r});}return t}sort(){this.axes.sort((i,t)=>i.beginAt-t.beginAt);}toMap(i){let t=new Map;return i.forEach(a=>{t[a.key]=a,t.set(a.key,a);}),t}};

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
    let BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
    let AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
    let BOXES_POSITION = [0.0, 0.0, 0.0];

    const setup = (canvas) => {
      const webgl = new WebGLUtility(); // WebGL API をまとめたユーティリティ
      // 時間軸の設定
      const taxis = new g({
        timeline: {
          container: document.querySelector('#timeline'),
          debug: false
        }
      });

      taxis.add('Sampling', 3 * 1000);
      for (let i = 0; i < get_store_value(settings).bucketsCount; i++) {
        if (i === 0) {
          taxis.add(`split#${i}`, 0.5 * 1000, 500);
        } else {
          taxis.add(`split#${i}`, 0.5 * 1000);
        }
      }
      for (let i = 0; i < get_store_value(settings).bucketsCount; i++) {
        taxis.add(`Average color#${i}`, 0.5 * 1000);
      }
      taxis.add('Mapping', 3 * 1000, 500);

      let medianCut;
      let bucketsPerStep = [];
      let currentBucket = 0;

      let paintedBucket = -1;

      // キャンバスのセットアップ
      webgl.initialize(canvas);

      // プログラムオブジェクト
      let programMain = null;
      let programSub = null;

      // 減色前のテクスチャ
      let beforeImage;
      let beforeImageVBO;
      let beforeImageIBO;
      // 減色後のテクスチャ
      let afterImage;
      // buckets
      let boxes = [];
      let boxesPosition = [];
      let boxesVBO = [];
      let boxesIBO = [];
      let boxesLine = [];
      let boxesLineVBO = [];
      // points
      let pointsFromPosition = [];
      let pointsToPosition = [];
      let pointsColor = [];
      let pointsVBO = [];
      let afterPointsFromPosition = [];
      let afterPointsToPosition = [];
      let afterPointsColor = [];
      let afterPointsVBO = [];
      // axis
      let axis;
      let axisVBO;

      let attLocation;
      let attStride;
      let uniLocation = null; // uniform location
      let attLocationSub;
      let attStrideSub;
      let uniLocationSub = null; // uniform location
      let beforeTexture = null; // テクスチャオブジェクト @@@
      let imageData;
      let reduceImageData;

      let vMatrix = null; // ビュー行列
      let pMatrix = null; // プロジェクション行列
      let vpMatrix = null; // ビュー x プロジェクション行列
      // カメラのセットアップ
      const cameraOption = {
        distance: 7.5,
        min: 1.0,
        max: 20.0,
        move: 2.0,
      };
      const camera = new WebGLOrbitCamera(canvas, cameraOption);

      webgl.width = window.innerWidth;
      webgl.height = window.innerHeight;
      updateSize();
      window.addEventListener('resize', updateSize);

      /**
       *
       */
      window.Promise.resolve()
        // .then(() => loadImage('./assets/512.png'))
        .then((image) => {
          // TODO: デバッグ？？？？
          

          
          image = get_store_value(app$1).file;
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

          // 画像がロードできたので、テクスチャオブジェクトを生成する
          beforeTexture = webgl.createTexture(image, webgl.gl.TEXTURE0);
          // 今回はテクスチャを途中で切り替えるわけではないので……
          // ユニット０に対してテクスチャをあらかじめバインドしておく
          // // TODO: 上のテクスチャと共に関数か
          webgl.createTexture(reduceImageData, webgl.gl.TEXTURE1);
          // 今回はテクスチャを途中で切り替えるわけではないので……
          // ユニット０に対してテクスチャをあらかじめバインドしておく
        })
        .then(() =>
          window.Promise.all([
            WebGLUtility.loadFile('./shader/main.vert'),
            WebGLUtility.loadFile('./shader/main.frag'),
            WebGLUtility.loadFile('./shader/sub.vert'),
            WebGLUtility.loadFile('./shader/sub.frag'),
          ]),
        )
        .then((ress) => {
          // shaderをprogram紐付ける
          const [mainVert, mainFrag, subVert, subFrag] = ress;
          const mainVs = webgl.createShaderObject(mainVert, webgl.gl.VERTEX_SHADER);
          const mainFs = webgl.createShaderObject(mainFrag, webgl.gl.FRAGMENT_SHADER);
          programMain = webgl.createProgramObject(mainVs, mainFs);
          const subVs = webgl.createShaderObject(subVert, webgl.gl.VERTEX_SHADER);
          const subFs = webgl.createShaderObject(subFrag, webgl.gl.FRAGMENT_SHADER);
          programSub = webgl.createProgramObject(subVs, subFs);
          webgl.program = programMain;

          const gl = webgl.gl;
          // 震度テストを有効に
          gl.enable(gl.DEPTH_TEST);
          // 裏面も表示
          gl.disable(gl.CULL_FACE);
          gl.enable(gl.BLEND);
          gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE); // アルファブレンディング

          setupBeforeTexture();
          setupAfterTexture();
          setupPointGeometry();
          setupAfterPointGeometry();
          setupBoxesGeometry();
          setupAxisGeometry();
          setupLocation();
          setupLocationSub();

          taxis.begin();

          render();
        });

      function updateSize() {
        webgl.width = window.innerWidth;
        webgl.height = window.innerHeight;

        // TODO: スマホ
        if (window.innerWidth < window.innerHeight) {
          camera.distance = 1000 / window.innerHeight * cameraOption.distance;
          BEFORE_TEXTURE_POSITION = [0.0, 1.5, 0.0];
          AFTER_TEXTURE_POSITION = [0.0, -1.5, 0.0];
          BOXES_POSITION = [0.0, 0.0, 0.0];
        } else {
          camera.distance = 900 / window.innerWidth * cameraOption.distance;
          BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
          AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
          BOXES_POSITION = [0.0, 0.0, 0.0];
        }
      }

      /**
       *
       */
      function setupBeforeTexture() {
        beforeImage = WebGLGeometry.plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0, [1.0, 0.1, 0.0, 1.0]);
        beforeImageVBO = [
          webgl.createVBO(beforeImage.position),
          webgl.createVBO(beforeImage.color),
          webgl.createVBO(beforeImage.texCoord), // テクスチャ座標 @@@
        ];
        // インデックスバッファを生成
        beforeImageIBO = webgl.createIBO(beforeImage.index);
      }

      /**
       *
       */
      function setupAfterTexture() {
        afterImage = WebGLGeometry.plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0, [1.0, 0.1, 0.0, 1.0]);
        [
          webgl.createVBO(afterImage.position),
          webgl.createVBO(afterImage.color),
          webgl.createVBO(afterImage.texCoord), // テクスチャ座標 @@@
        ];
        // インデックスバッファを生成
        webgl.createIBO(afterImage.index);
      }

      /**
       *
       */
      function setupPointGeometry() {
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

          pointsFromPosition.push(
            x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + BEFORE_TEXTURE_POSITION[0],
            (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + BEFORE_TEXTURE_POSITION[1],
            BEFORE_TEXTURE_POSITION[2],
          );
          pointsToPosition.push(
            r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0],
            g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1],
            b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2],
          );
          pointsColor.push(r / 255, g / 255, b / 255, a / 255);
        }
        pointsVBO = [webgl.createVBO(pointsFromPosition), webgl.createVBO(pointsToPosition), webgl.createVBO(pointsColor)];
      }

      function setupAfterPointGeometry() {
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

          afterPointsFromPosition.push(
            r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0],
            g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1],
            b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2],
          );
          afterPointsToPosition.push(
            x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + AFTER_TEXTURE_POSITION[0],
            (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + AFTER_TEXTURE_POSITION[1],
            AFTER_TEXTURE_POSITION[2],
          );

          const reduceR = reduceImageData.data[i * 4];
          const reduceG = reduceImageData.data[i * 4 + 1];
          const reduceB = reduceImageData.data[i * 4 + 2];
          const reduceA = reduceImageData.data[i * 4 + 3];
          afterPointsColor.push(reduceR / 255, reduceG / 255, reduceB / 255, reduceA / 255);
        }
        afterPointsVBO = [webgl.createVBO(afterPointsFromPosition), webgl.createVBO(afterPointsToPosition), webgl.createVBO(afterPointsColor)];
      }

      /**
       *
       */
      function setupBoxesGeometry() {
        bucketsPerStep.forEach((bucketList, i) => {
          boxes[i] = [];
          boxesPosition[i] = [];
          boxesVBO[i] = [];
          boxesIBO[i] = [];
          boxesLine[i] = [];
          boxesLineVBO[i] = [];
          bucketList.forEach((bucket, j) => {
            const { total, colors, channel, minR, minG, minB, maxR, maxG, maxB } = bucketsPerStep[i][j];
            const width = (maxR - minR) / 255;
            const height = (maxG - minG) / 255;
            const depth = (maxB - minB) / 255;
            const color = e.averageColor(colors);

            const box = WebGLGeometry.box(width, height, depth, [color[0] / 255, color[1] / 255, color[2] / 255, 0.8]);

            const boxLine = WebGLGeometry.boxLine(width, height, depth, [0.65, 0.65, 0.65, 1.0]);

            // boxの枠線を作る
            boxesLine[i][j] = boxLine;
            boxesLineVBO[i][j] = [webgl.createVBO(boxLine.position), webgl.createVBO(boxLine.color)];

            boxes[i][j] = box;

            boxesPosition[i][j] = [
              minR / 255 - (1 - width) / 2,
              minG / 255 - (1 - height) / 2,
              minB / 255 - (1 - depth) / 2,
            ];
            boxesVBO[i][j] = [webgl.createVBO(box.position), webgl.createVBO(box.color)];
            // インデックスバッファを生成
            boxesIBO[i][j] = webgl.createIBO(box.index);
          });
        });
      }

      function setupAxisGeometry() {
        axis = WebGLGeometry.axis(10, [0.45, 0.45, 0.45, 1.0]);
        axisVBO = [webgl.createVBO(axis.position), webgl.createVBO(axis.color)];
      }

      /**
       *
       */
      function setupLocation() {
        const gl = webgl.gl;
        webgl.program = programMain;
        // attribute location の取得と有効化
        attLocation = [
          gl.getAttribLocation(webgl.program, 'position'),
          gl.getAttribLocation(webgl.program, 'color'),
          gl.getAttribLocation(webgl.program, 'texCoord'), // テクスチャ座標 @@@
        ];
        attStride = [3, 4, 2];

        uniLocation = {
          mvpMatrix: gl.getUniformLocation(webgl.program, 'mvpMatrix'),
          textureUnit: gl.getUniformLocation(webgl.program, 'textureUnit'),
          isTexture: gl.getUniformLocation(webgl.program, 'isTexture'),
        };
      }

      /**
       *
       */
      function setupLocationSub() {
        const gl = webgl.gl;
        webgl.program = programSub;
        // attribute location の取得と有効化
        attLocationSub = [
          gl.getAttribLocation(webgl.program, 'fromPosition'),
          gl.getAttribLocation(webgl.program, 'toPosition'),
          gl.getAttribLocation(webgl.program, 'color'),
        ];
        attStrideSub = [3, 3, 4];

        uniLocationSub = {
          mMatrix: gl.getUniformLocation(webgl.program, 'mMatrix'),
          mvpMatrix: gl.getUniformLocation(webgl.program, 'mvpMatrix'),
          interporation: gl.getUniformLocation(webgl.program, 'interporation'),
          eyePosition: gl.getUniformLocation(webgl.program, 'eyePosition'),
        };
      }

      /**
       * レンダリングのためのセットアップを行う
       */
      function setupRendering() {
        const gl = webgl.gl;
        // clear処理
        gl.viewport(0, 0, webgl.width, webgl.height);
        gl.clearColor(0.1, 0.12, 0.14, 1.0);

        gl.clear(gl.COLOR_BUFFER_BIT);

        // カメラの状態に応じたビュー行列を生成 @@@
        vMatrix = camera.update();
        // プロジェクション行列を生成
        const fovy = 45;
        const aspect = webgl.width / webgl.height;
        const near = 0.1;
        const far = 20.0;
        pMatrix = WebGLMath.mat4.perspective(fovy, aspect, near, far);
        vpMatrix = WebGLMath.mat4.multiply(pMatrix, vMatrix);
      }

      /**
       *
       * @param position
       */
      function setupMvp(position) {
        const gl = webgl.gl;
        // モデル行列を生成する
        let mMatrix = WebGLMath.mat4.identity(WebGLMath.mat4.create());
        mMatrix = WebGLMath.mat4.translate(mMatrix, position);
        // mvp 行列を生成してシェーダに送る
        const mvpMatrix = WebGLMath.mat4.multiply(vpMatrix, mMatrix);
        gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);
      }

      /**
       *
       * @param position
       */
      function setupMvpSub(position) {
        const gl = webgl.gl;
        // モデル行列を生成する
        let mMatrix = WebGLMath.mat4.identity(WebGLMath.mat4.create());
        mMatrix = WebGLMath.mat4.translate(mMatrix, position);

        gl.uniformMatrix4fv(uniLocationSub.mMatrix, false, mMatrix);

        // mvp 行列を生成してシェーダに送る
        const mvpMatrix = WebGLMath.mat4.multiply(vpMatrix, mMatrix);
        gl.uniformMatrix4fv(uniLocationSub.mvpMatrix, false, mvpMatrix);
      }

      /**
       *
       * @param position
       */
      function renderBeforeTexture(position) {
        const gl = webgl.gl;

        webgl.enableAttribute(beforeImageVBO, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, beforeImageIBO);

        // テクスチャを使うかどうかのフラグをシェーダに送る @@@
        gl.activeTexture(webgl.gl.TEXTURE0);
        gl.bindTexture(webgl.gl.TEXTURE_2D, beforeTexture);
        gl.uniform1i(uniLocation.textureUnit, 0);
        gl.uniform1i(uniLocation.isTexture, 1);

        gl.enableVertexAttribArray(attLocation[2]);

        setupMvp(position);

        gl.drawElements(gl.TRIANGLES, beforeImage.index.length, gl.UNSIGNED_SHORT, 0);
      }

      /**
       *
       * @param position
       */
      function renderBoxes(position) {
        const gl = webgl.gl;
        gl.disableVertexAttribArray(attLocation[2]);
        // テクスチャを使うかどうかのフラグをシェーダに送る @@@
        gl.uniform1i(uniLocation.isTexture, 0);

        const lastIndex = boxes.length - 1;

        for (let i = 0; i <= paintedBucket; i++) {
          webgl.enableAttribute(boxesVBO[lastIndex][i], attLocation, attStride);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxesIBO[lastIndex][i]);

          const pos = [
            position[0] + boxesPosition[lastIndex][i][0],
            position[1] + boxesPosition[lastIndex][i][1],
            position[2] + boxesPosition[lastIndex][i][2],
          ];
          setupMvp(pos);

          gl.drawElements(gl.TRIANGLES, boxes[lastIndex][i].index.length, gl.UNSIGNED_SHORT, 0);
        }
      }

      function renderBoxesLine(position) {
        const gl = webgl.gl;
        gl.disableVertexAttribArray(attLocation[2]);
        // テクスチャを使うかどうかのフラグをシェーダに送る @@@
        gl.uniform1i(uniLocation.isTexture, 0);

        for (let i = 0; i < boxes[currentBucket].length; i++) {
          webgl.enableAttribute(boxesLineVBO[currentBucket][i], attLocation, attStride);

          const pos = [
            position[0] + boxesPosition[currentBucket][i][0],
            position[1] + boxesPosition[currentBucket][i][1],
            position[2] + boxesPosition[currentBucket][i][2],
          ];
          setupMvp(pos);

          gl.drawArrays(gl.LINES, 0, boxesLine[currentBucket][i].position.length / 3);
        }
      }

      function renderAxis() {
        const gl = webgl.gl;
        gl.uniform1i(uniLocation.isTexture, 0);

        gl.disableVertexAttribArray(attLocation[2]);

        webgl.enableAttribute(axisVBO, attLocation, attStride);

        setupMvp([0.0, 0.0, 0.0]);

        gl.drawArrays(gl.LINES, 0, axis.position.length / 3);
      }

      /**
       *
       * @param position
       */
      function renderMovePoints(position) {
        const gl = webgl.gl;

        const axis = taxis.getAxis({ key: 'Sampling' });
        gl.uniform1f(uniLocationSub.interporation, axis.progress);

        webgl.enableAttribute(pointsVBO, attLocationSub, attStrideSub);

        setupMvpSub(position);

        gl.drawArrays(gl.POINTS, 0, pointsToPosition.length / 3);
      }

      function renderMoveAfterPoints(position) {
        const gl = webgl.gl;

        const axis = taxis.getAxis({ key: 'Mapping' });
        if (axis.progress === 0) {
          return;
        }
        gl.uniform1f(uniLocationSub.interporation, axis.progress);

        webgl.enableAttribute(afterPointsVBO, attLocationSub, attStrideSub);

        setupMvpSub(position);

        gl.drawArrays(gl.POINTS, 0, afterPointsToPosition.length / 3);
      }

      /**
       *
       */
      function render() {
        const gl = webgl.gl;
        // TODO: 何度もticketAddされちゃうのを修正
        taxis.ticker((delta, axes) => {
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

          // レンダリング時のクリア処理など
          setupRendering();

          // subの描画
          webgl.program = programSub;
          gl.uniform3fv(uniLocationSub.eyePosition, camera.position);
          renderMovePoints([0.0, 0.0, 0.0]);
          renderMoveAfterPoints([0.0, 0.0, 0.0]);

          // mainの描画
          webgl.program = programMain;
          renderAxis();
          renderBeforeTexture(BEFORE_TEXTURE_POSITION);
          // renderAfterTexture(AFTER_TEXTURE_POSITION);

          if (axes.get('split#0').enter) {
            renderBoxesLine(BOXES_POSITION);
            if (-1 < paintedBucket) {
              renderBoxes(BOXES_POSITION);
            }
          }
        });

      }
    };

    /* src/components/Viewer/Viewer.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/components/Viewer/Viewer.svelte";

    function create_fragment$2(ctx) {
    	let canvas;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "class", "w-full h-full");
    			add_location(canvas, file$2, 8, 0, 168);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[1](canvas);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[1](null);
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

    	onMount(() => {
    		setup(canvasElement);
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

    	$$self.$capture_state = () => ({ onMount, setup, canvasElement });

    	$$self.$inject_state = $$props => {
    		if ("canvasElement" in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, canvas_binding];
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
    	let div2;
    	let div1;
    	let t2;
    	let div3;
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
    			div2 = element("div");
    			div1 = element("div");
    			t2 = space();
    			div3 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(div0, "class", "fixed right-8 top-8 hidden md:block");
    			add_location(div0, file, 17, 5, 495);
    			attr_dev(div1, "id", "timeline");
    			attr_dev(div1, "class", "h-full");
    			add_location(div1, file, 21, 6, 635);
    			attr_dev(div2, "class", "fixed left-0 right-0 bottom-0 h-1/5");
    			add_location(div2, file, 20, 4, 579);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M6 18L18 6M6 6l12 12");
    			add_location(path, file, 25, 8, 894);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-8 text-gray-800");
    			add_location(svg, file, 24, 6, 800);
    			attr_dev(div3, "class", "fixed left-8 top-8 bg-gray-100 p-2 cursor-pointer rounded-full");
    			add_location(div3, file, 23, 4, 691);
    		},
    		m: function mount(target, anchor) {
    			mount_component(viewer, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(nav, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, svg);
    			append_dev(svg, path);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", /*handleRemove*/ ctx[1], false, false, false);
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
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
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
