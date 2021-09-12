
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
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
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.5' }, detail), true));
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
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
     * Transpose the values of a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function transpose(out, a) {
      // If we are transposing ourselves we can skip a few steps but have to cache some values
      if (out === a) {
        var a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        var a12 = a[6],
            a13 = a[7];
        var a23 = a[11];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
      } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
      }

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
    // TODO: 変更
    const cube = (side, color) => {
        const hs = side * 0.5;
        // prettier-ignore
        const position = [
            -hs, -hs, hs,
            hs, -hs, hs,
            hs, hs, hs,
            -hs, hs, hs,
            -hs, -hs, -hs,
            -hs, hs, -hs,
            hs, hs, -hs,
            hs, -hs, -hs,
            -hs, hs, -hs,
            -hs, hs, hs,
            hs, hs, hs,
            hs, hs, -hs,
            -hs, -hs, -hs,
            hs, -hs, -hs,
            hs, -hs, hs,
            -hs, -hs, hs,
            hs, -hs, -hs,
            hs, hs, -hs,
            hs, hs, hs,
            hs, -hs, hs,
            -hs, -hs, -hs,
            -hs, -hs, hs,
            -hs, hs, hs,
            -hs, hs, -hs // 左上奥
        ];
        let v = 1.0 / Math.sqrt(3.0);
        // prettier-ignore
        const normal = [
            -v, -v, v, v, -v, v, v, v, v, -v, v, v,
            -v, -v, -v, -v, v, -v, v, v, -v, v, -v, -v,
            -v, v, -v, -v, v, v, v, v, v, v, v, -v,
            -v, -v, -v, v, -v, -v, v, -v, v, -v, -v, v,
            v, -v, -v, v, v, -v, v, v, v, v, -v, v,
            -v, -v, -v, -v, -v, v, -v, v, v, -v, v, -v
        ];
        let col = [];
        for (let i = 0; i < position.length / 3; i++) {
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
        return { position, normal, color: col, texCoord: st, index: idx };
    };
    const cubeWireframe = (width, height, depth, color) => {
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

    // TODO: scaleの挙動がなんか変
    // TODO: オプション
    // TODO: 移動系のメソッド
    class Camera$1 {
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

    var fragment$1 = "precision mediump float;\n\nvarying vec4 vColor;\n\nvoid main(){\n    gl_FragColor = vColor;\n}\n\n";

    var vertex$1 = "attribute vec3 position;\nattribute vec4 color;\nuniform mat4 mvpMatrix;\nvarying vec4 vColor;\n\n\nvoid main(){\n    vColor = color;\n\n    gl_Position = mvpMatrix * vec4(position, 1.0);\n}\n\n";

    const { attribute: attribute$1, uniform: uniform$1, uniLocation: uniLocation$1 } = parseVariables({ vertex: vertex$1, fragment: fragment$1 });

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var tweakpane = {exports: {}};

    /*! Tweakpane 1.6.1 (c) 2016 cocopon, licensed under the MIT license. */

    (function (module, exports) {
    (function (global, factory) {
        module.exports = factory() ;
    }(commonjsGlobal, (function () {
        var extendStatics = function(d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        function __extends(d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }
        var __assign = function() {
            __assign = Object.assign || function __assign(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
            return __assign.apply(this, arguments);
        };
        function __spreadArrays() {
            for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
            for (var r = Array(s), k = 0, i = 0; i < il; i++)
                for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                    r[k] = a[j];
            return r;
        }

        var Plugins = {
            inputs: [],
            monitors: [],
        };
        function getAllPlugins() {
            return __spreadArrays(Plugins.inputs, Plugins.monitors);
        }

        function forceCast(v) {
            return v;
        }
        function isEmpty(value) {
            return value === null || value === undefined;
        }
        function deepEqualsArray(a1, a2) {
            if (a1.length !== a2.length) {
                return false;
            }
            for (var i = 0; i < a1.length; i++) {
                if (a1[i] !== a2[i]) {
                    return false;
                }
            }
            return true;
        }

        function disposeElement(elem) {
            if (elem && elem.parentElement) {
                elem.parentElement.removeChild(elem);
            }
            return null;
        }

        var PREFIX = 'tp';
        function ClassName(viewName) {
            return function (opt_elementName, opt_modifier) {
                return [
                    PREFIX,
                    '-',
                    viewName,
                    'v',
                    opt_elementName ? "_" + opt_elementName : '',
                    opt_modifier ? "-" + opt_modifier : '',
                ].join('');
            };
        }

        function getAllBladePositions() {
            return ['first', 'last'];
        }

        var className = ClassName('');
        function setUpBladeView(view, model) {
            var elem = view.element;
            model.emitter.on('change', function (ev) {
                if (ev.propertyName === 'hidden') {
                    var hiddenClass = className(undefined, 'hidden');
                    if (model.hidden) {
                        elem.classList.add(hiddenClass);
                    }
                    else {
                        elem.classList.remove(hiddenClass);
                    }
                }
                else if (ev.propertyName === 'positions') {
                    getAllBladePositions().forEach(function (pos) {
                        elem.classList.remove(className(undefined, pos));
                    });
                    model.positions.forEach(function (pos) {
                        elem.classList.add(className(undefined, pos));
                    });
                }
            });
            model.emitter.on('dispose', function () {
                if (view.onDispose) {
                    view.onDispose();
                }
                disposeElement(elem);
            });
        }

        /**
         * @hidden
         */
        var Emitter = /** @class */ (function () {
            function Emitter() {
                this.observers_ = {};
            }
            Emitter.prototype.on = function (eventName, handler) {
                var observers = this.observers_[eventName];
                if (!observers) {
                    observers = this.observers_[eventName] = [];
                }
                observers.push({
                    handler: handler,
                });
                return this;
            };
            Emitter.prototype.off = function (eventName, handler) {
                var observers = this.observers_[eventName];
                if (observers) {
                    this.observers_[eventName] = observers.filter(function (observer) {
                        return observer.handler !== handler;
                    });
                }
                return this;
            };
            Emitter.prototype.emit = function (eventName, event) {
                var observers = this.observers_[eventName];
                if (!observers) {
                    return;
                }
                observers.forEach(function (observer) {
                    observer.handler(event);
                });
            };
            return Emitter;
        }());

        /**
         * @hidden
         */
        var Button = /** @class */ (function () {
            function Button(title) {
                this.emitter = new Emitter();
                this.title = title;
            }
            Button.prototype.click = function () {
                this.emitter.emit('click', {
                    sender: this,
                });
            };
            return Button;
        }());

        var className$1 = ClassName('btn');
        /**
         * @hidden
         */
        var ButtonView = /** @class */ (function () {
            function ButtonView(doc, config) {
                this.button = config.button;
                this.element = doc.createElement('div');
                this.element.classList.add(className$1());
                var buttonElem = doc.createElement('button');
                buttonElem.classList.add(className$1('b'));
                buttonElem.textContent = this.button.title;
                this.element.appendChild(buttonElem);
                this.buttonElement = buttonElem;
            }
            return ButtonView;
        }());

        /**
         * @hidden
         */
        var ButtonController = /** @class */ (function () {
            function ButtonController(doc, config) {
                this.onButtonClick_ = this.onButtonClick_.bind(this);
                this.button = new Button(config.title);
                this.blade = config.blade;
                this.view = new ButtonView(doc, {
                    button: this.button,
                });
                this.view.buttonElement.addEventListener('click', this.onButtonClick_);
                setUpBladeView(this.view, this.blade);
            }
            ButtonController.prototype.onButtonClick_ = function () {
                this.button.click();
            };
            return ButtonController;
        }());

        var className$2 = ClassName('lbl');
        function createLabelNode(doc, label) {
            var frag = doc.createDocumentFragment();
            var lineNodes = label.split('\n').map(function (line) {
                return doc.createTextNode(line);
            });
            lineNodes.forEach(function (lineNode, index) {
                if (index > 0) {
                    frag.appendChild(doc.createElement('br'));
                }
                frag.appendChild(lineNode);
            });
            return frag;
        }
        /**
         * @hidden
         */
        var LabeledView = /** @class */ (function () {
            function LabeledView(doc, config) {
                this.label = config.label;
                this.elem_ = doc.createElement('div');
                this.elem_.classList.add(className$2());
                var labelElem = doc.createElement('div');
                labelElem.classList.add(className$2('l'));
                labelElem.appendChild(createLabelNode(doc, this.label));
                this.elem_.appendChild(labelElem);
                var viewElem = doc.createElement('div');
                viewElem.classList.add(className$2('v'));
                viewElem.appendChild(config.view.element);
                this.elem_.appendChild(viewElem);
            }
            Object.defineProperty(LabeledView.prototype, "element", {
                get: function () {
                    return this.elem_;
                },
                enumerable: false,
                configurable: true
            });
            return LabeledView;
        }());

        /**
         * @hidden
         */
        var InputBindingController = /** @class */ (function () {
            function InputBindingController(doc, config) {
                this.binding = config.binding;
                this.controller = config.controller;
                this.view = new LabeledView(doc, {
                    label: config.label,
                    view: this.controller.view,
                });
                this.blade = config.blade;
                setUpBladeView(this.view, this.blade);
            }
            return InputBindingController;
        }());

        /**
         * @hidden
         */
        var MonitorBindingController = /** @class */ (function () {
            function MonitorBindingController(doc, config) {
                var _this = this;
                this.binding = config.binding;
                this.controller = config.controller;
                this.view = new LabeledView(doc, {
                    label: config.label,
                    view: this.controller.view,
                });
                this.blade = config.blade;
                this.blade.emitter.on('dispose', function () {
                    _this.binding.dispose();
                });
                setUpBladeView(this.view, this.blade);
            }
            return MonitorBindingController;
        }());

        /**
         * @hidden
         */
        var Disposable = /** @class */ (function () {
            function Disposable() {
                this.emitter = new Emitter();
                this.disposed_ = false;
            }
            Object.defineProperty(Disposable.prototype, "disposed", {
                get: function () {
                    return this.disposed_;
                },
                enumerable: false,
                configurable: true
            });
            Disposable.prototype.dispose = function () {
                if (this.disposed_) {
                    return false;
                }
                this.disposed_ = true;
                this.emitter.emit('dispose', {
                    sender: this,
                });
                return true;
            };
            return Disposable;
        }());

        var Blade = /** @class */ (function () {
            function Blade() {
                this.onDispose_ = this.onDispose_.bind(this);
                this.emitter = new Emitter();
                this.positions_ = [];
                this.hidden_ = false;
                this.disposable_ = new Disposable();
                this.disposable_.emitter.on('dispose', this.onDispose_);
            }
            Object.defineProperty(Blade.prototype, "hidden", {
                get: function () {
                    return this.hidden_;
                },
                set: function (hidden) {
                    if (this.hidden_ === hidden) {
                        return;
                    }
                    this.hidden_ = hidden;
                    this.emitter.emit('change', {
                        propertyName: 'hidden',
                        sender: this,
                    });
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Blade.prototype, "positions", {
                get: function () {
                    return this.positions_;
                },
                set: function (positions) {
                    if (deepEqualsArray(positions, this.positions_)) {
                        return;
                    }
                    this.positions_ = positions;
                    this.emitter.emit('change', {
                        propertyName: 'positions',
                        sender: this,
                    });
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Blade.prototype, "disposed", {
                get: function () {
                    return this.disposable_.disposed;
                },
                enumerable: false,
                configurable: true
            });
            Blade.prototype.dispose = function () {
                this.disposable_.dispose();
            };
            Blade.prototype.onDispose_ = function () {
                this.emitter.emit('dispose', {
                    sender: this,
                });
            };
            return Blade;
        }());

        var SVG_NS = 'http://www.w3.org/2000/svg';
        function forceReflow(element) {
            element.offsetHeight;
        }
        function disableTransitionTemporarily(element, callback) {
            var t = element.style.transition;
            element.style.transition = 'none';
            callback();
            element.style.transition = t;
        }
        function supportsTouch(doc) {
            return doc.ontouchstart !== undefined;
        }
        function getGlobalObject() {
            return new Function('return this')();
        }
        function getWindowDocument() {
            var globalObj = forceCast(getGlobalObject());
            return globalObj.document;
        }
        function isBrowser() {
            return 'document' in getGlobalObject();
        }
        function getCanvasContext(canvasElement) {
            // HTMLCanvasElement.prototype.getContext is not defined on testing environment
            return isBrowser() ? canvasElement.getContext('2d') : null;
        }
        var ICON_ID_TO_INNER_HTML_MAP = {
            p2dpad: '<path d="M8 2V14" stroke="currentColor" stroke-width="1.5"/><path d="M2 8H14" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/>',
        };
        function createSvgIconElement(document, iconId) {
            var elem = document.createElementNS(SVG_NS, 'svg');
            elem.innerHTML = ICON_ID_TO_INNER_HTML_MAP[iconId];
            return elem;
        }
        function insertElementAt(parentElement, element, index) {
            parentElement.insertBefore(element, parentElement.children[index]);
        }
        function findNextTarget(ev) {
            if (ev.relatedTarget) {
                return forceCast(ev.relatedTarget);
            }
            // Workaround for Firefox
            if ('explicitOriginalTarget' in ev) {
                return ev.explicitOriginalTarget;
            }
            // TODO: Workaround for Safari
            // Safari doesn't set next target for some elements
            // (e.g. button, input[type=checkbox], etc.)
            return null;
        }

        function updateAllItemsPositions(bladeRack) {
            var visibleItems = bladeRack.items.filter(function (bc) { return !bc.blade.hidden; });
            var firstVisibleItem = visibleItems[0];
            var lastVisibleItem = visibleItems[visibleItems.length - 1];
            bladeRack.items.forEach(function (bc) {
                var ps = [];
                if (bc === firstVisibleItem) {
                    ps.push('first');
                }
                if (bc === lastVisibleItem) {
                    ps.push('last');
                }
                bc.blade.positions = ps;
            });
        }
        /**
         * @hidden
         */
        function computeExpandedFolderHeight(folder, containerElement) {
            var height = 0;
            disableTransitionTemporarily(containerElement, function () {
                // Expand folder temporarily
                folder.expandedHeight = null;
                folder.temporaryExpanded = true;
                forceReflow(containerElement);
                // Compute height
                height = containerElement.clientHeight;
                // Restore expanded
                folder.temporaryExpanded = null;
                forceReflow(containerElement);
            });
            return height;
        }

        /**
         * @hidden
         */
        var List = /** @class */ (function () {
            function List() {
                this.emitter = new Emitter();
                this.items_ = [];
            }
            Object.defineProperty(List.prototype, "items", {
                get: function () {
                    return this.items_;
                },
                enumerable: false,
                configurable: true
            });
            List.prototype.add = function (item, opt_index) {
                var index = opt_index !== undefined ? opt_index : this.items_.length;
                this.items_.splice(index, 0, item);
                this.emitter.emit('add', {
                    index: index,
                    item: item,
                    sender: this,
                });
            };
            List.prototype.remove = function (item) {
                var index = this.items_.indexOf(item);
                if (index < 0) {
                    return;
                }
                this.items_.splice(index, 1);
                this.emitter.emit('remove', {
                    sender: this,
                });
            };
            return List;
        }());

        /**
         * @hidden
         */
        var BladeRack = /** @class */ (function () {
            function BladeRack() {
                this.onItemFolderFold_ = this.onItemFolderFold_.bind(this);
                this.onListItemLayout_ = this.onListItemLayout_.bind(this);
                this.onSubitemLayout_ = this.onSubitemLayout_.bind(this);
                this.onSubitemFolderFold_ = this.onSubitemFolderFold_.bind(this);
                this.onSubitemInputChange_ = this.onSubitemInputChange_.bind(this);
                this.onSubitemMonitorUpdate_ = this.onSubitemMonitorUpdate_.bind(this);
                this.onItemInputChange_ = this.onItemInputChange_.bind(this);
                this.onListAdd_ = this.onListAdd_.bind(this);
                this.onListItemDispose_ = this.onListItemDispose_.bind(this);
                this.onListRemove_ = this.onListRemove_.bind(this);
                this.onItemMonitorUpdate_ = this.onItemMonitorUpdate_.bind(this);
                this.blades_ = new List();
                this.emitter = new Emitter();
                this.blades_.emitter.on('add', this.onListAdd_);
                this.blades_.emitter.on('remove', this.onListRemove_);
            }
            Object.defineProperty(BladeRack.prototype, "items", {
                get: function () {
                    return this.blades_.items;
                },
                enumerable: false,
                configurable: true
            });
            BladeRack.prototype.add = function (bc, opt_index) {
                this.blades_.add(bc, opt_index);
            };
            BladeRack.prototype.find = function (controllerClass) {
                return this.items.reduce(function (results, bc) {
                    if (bc instanceof FolderController) {
                        results.push.apply(results, bc.bladeRack.find(controllerClass));
                    }
                    if (bc instanceof controllerClass) {
                        results.push(bc);
                    }
                    return results;
                }, []);
            };
            BladeRack.prototype.onListAdd_ = function (ev) {
                var bc = ev.item;
                this.emitter.emit('add', {
                    blade: bc,
                    index: ev.index,
                    sender: this,
                });
                bc.blade.emitter.on('dispose', this.onListItemDispose_);
                bc.blade.emitter.on('change', this.onListItemLayout_);
                if (bc instanceof InputBindingController) {
                    bc.binding.emitter.on('change', this.onItemInputChange_);
                }
                else if (bc instanceof MonitorBindingController) {
                    bc.binding.emitter.on('update', this.onItemMonitorUpdate_);
                }
                else if (bc instanceof FolderController) {
                    bc.folder.emitter.on('change', this.onItemFolderFold_);
                    var emitter = bc.bladeRack.emitter;
                    emitter.on('itemfold', this.onSubitemFolderFold_);
                    emitter.on('itemlayout', this.onSubitemLayout_);
                    emitter.on('inputchange', this.onSubitemInputChange_);
                    emitter.on('monitorupdate', this.onSubitemMonitorUpdate_);
                }
            };
            BladeRack.prototype.onListRemove_ = function (_) {
                this.emitter.emit('remove', {
                    sender: this,
                });
            };
            BladeRack.prototype.onListItemLayout_ = function (ev) {
                if (ev.propertyName === 'hidden' || ev.propertyName === 'positions') {
                    this.emitter.emit('itemlayout', {
                        sender: this,
                    });
                }
            };
            BladeRack.prototype.onListItemDispose_ = function (_) {
                var _this = this;
                var disposedUcs = this.blades_.items.filter(function (bc) {
                    return bc.blade.disposed;
                });
                disposedUcs.forEach(function (bc) {
                    _this.blades_.remove(bc);
                });
            };
            BladeRack.prototype.onItemInputChange_ = function (ev) {
                this.emitter.emit('inputchange', {
                    inputBinding: ev.sender,
                    sender: this,
                    value: ev.rawValue,
                });
            };
            BladeRack.prototype.onItemMonitorUpdate_ = function (ev) {
                this.emitter.emit('monitorupdate', {
                    monitorBinding: ev.sender,
                    sender: this,
                    value: ev.rawValue,
                });
            };
            BladeRack.prototype.onItemFolderFold_ = function (ev) {
                if (ev.propertyName !== 'expanded') {
                    return;
                }
                this.emitter.emit('itemfold', {
                    expanded: ev.sender.expanded,
                    sender: this,
                });
            };
            BladeRack.prototype.onSubitemLayout_ = function (_) {
                this.emitter.emit('itemlayout', {
                    sender: this,
                });
            };
            BladeRack.prototype.onSubitemInputChange_ = function (ev) {
                this.emitter.emit('inputchange', {
                    inputBinding: ev.inputBinding,
                    sender: this,
                    value: ev.value,
                });
            };
            BladeRack.prototype.onSubitemMonitorUpdate_ = function (ev) {
                this.emitter.emit('monitorupdate', {
                    monitorBinding: ev.monitorBinding,
                    sender: this,
                    value: ev.value,
                });
            };
            BladeRack.prototype.onSubitemFolderFold_ = function (ev) {
                this.emitter.emit('itemfold', {
                    expanded: ev.expanded,
                    sender: this,
                });
            };
            return BladeRack;
        }());

        /**
         * @hidden
         */
        var Folder = /** @class */ (function () {
            function Folder(title, expanded) {
                this.emitter = new Emitter();
                this.expanded_ = expanded;
                this.expandedHeight_ = null;
                this.temporaryExpanded_ = null;
                this.shouldFixHeight_ = false;
                this.title = title;
            }
            Object.defineProperty(Folder.prototype, "expanded", {
                get: function () {
                    return this.expanded_;
                },
                set: function (expanded) {
                    var changed = this.expanded_ !== expanded;
                    if (!changed) {
                        return;
                    }
                    this.emitter.emit('beforechange', {
                        propertyName: 'expanded',
                        sender: this,
                    });
                    this.expanded_ = expanded;
                    this.emitter.emit('change', {
                        propertyName: 'expanded',
                        sender: this,
                    });
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Folder.prototype, "temporaryExpanded", {
                get: function () {
                    return this.temporaryExpanded_;
                },
                set: function (expanded) {
                    var changed = this.temporaryExpanded_ !== expanded;
                    if (!changed) {
                        return;
                    }
                    this.emitter.emit('beforechange', {
                        propertyName: 'temporaryExpanded',
                        sender: this,
                    });
                    this.temporaryExpanded_ = expanded;
                    this.emitter.emit('change', {
                        propertyName: 'temporaryExpanded',
                        sender: this,
                    });
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Folder.prototype, "expandedHeight", {
                get: function () {
                    return this.expandedHeight_;
                },
                set: function (expandedHeight) {
                    var changed = this.expandedHeight_ !== expandedHeight;
                    if (!changed) {
                        return;
                    }
                    this.emitter.emit('beforechange', {
                        propertyName: 'expandedHeight',
                        sender: this,
                    });
                    this.expandedHeight_ = expandedHeight;
                    this.emitter.emit('change', {
                        propertyName: 'expandedHeight',
                        sender: this,
                    });
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Folder.prototype, "shouldFixHeight", {
                get: function () {
                    return this.shouldFixHeight_;
                },
                set: function (shouldFixHeight) {
                    var changed = this.shouldFixHeight_ !== shouldFixHeight;
                    if (!changed) {
                        return;
                    }
                    this.emitter.emit('beforechange', {
                        propertyName: 'shouldFixHeight',
                        sender: this,
                    });
                    this.shouldFixHeight_ = shouldFixHeight;
                    this.emitter.emit('change', {
                        propertyName: 'shouldFixHeight',
                        sender: this,
                    });
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Folder.prototype, "styleExpanded", {
                get: function () {
                    var _a;
                    return (_a = this.temporaryExpanded) !== null && _a !== void 0 ? _a : this.expanded;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Folder.prototype, "styleHeight", {
                get: function () {
                    if (!this.styleExpanded) {
                        return '0';
                    }
                    if (this.shouldFixHeight && !isEmpty(this.expandedHeight)) {
                        return this.expandedHeight + "px";
                    }
                    return 'auto';
                },
                enumerable: false,
                configurable: true
            });
            return Folder;
        }());

        var className$3 = ClassName('fld');
        /**
         * @hidden
         */
        var FolderView = /** @class */ (function () {
            function FolderView(doc, config) {
                this.onFolderChange_ = this.onFolderChange_.bind(this);
                this.folder_ = config.folder;
                this.folder_.emitter.on('change', this.onFolderChange_);
                this.element = doc.createElement('div');
                this.element.classList.add(className$3());
                var titleElem = doc.createElement('button');
                titleElem.classList.add(className$3('t'));
                titleElem.textContent = this.folder_.title;
                this.element.appendChild(titleElem);
                this.titleElement = titleElem;
                var markElem = doc.createElement('div');
                markElem.classList.add(className$3('m'));
                this.titleElement.appendChild(markElem);
                var containerElem = doc.createElement('div');
                containerElem.classList.add(className$3('c'));
                this.element.appendChild(containerElem);
                this.containerElement = containerElem;
                this.applyModel_();
            }
            FolderView.prototype.applyModel_ = function () {
                var expanded = this.folder_.styleExpanded;
                var expandedClass = className$3(undefined, 'expanded');
                if (expanded) {
                    this.element.classList.add(expandedClass);
                }
                else {
                    this.element.classList.remove(expandedClass);
                }
                this.containerElement.style.height = this.folder_.styleHeight;
            };
            FolderView.prototype.onFolderChange_ = function () {
                this.applyModel_();
            };
            return FolderView;
        }());

        /**
         * @hidden
         */
        var FolderController = /** @class */ (function () {
            function FolderController(doc, config) {
                var _a;
                this.onContainerTransitionEnd_ = this.onContainerTransitionEnd_.bind(this);
                this.onFolderBeforeChange_ = this.onFolderBeforeChange_.bind(this);
                this.onTitleClick_ = this.onTitleClick_.bind(this);
                this.onRackAdd_ = this.onRackAdd_.bind(this);
                this.onRackItemLayout_ = this.onRackItemLayout_.bind(this);
                this.onRackRemove_ = this.onRackRemove_.bind(this);
                this.blade = config.blade;
                this.folder = new Folder(config.title, (_a = config.expanded) !== null && _a !== void 0 ? _a : true);
                this.folder.emitter.on('beforechange', this.onFolderBeforeChange_);
                this.rack_ = new BladeRack();
                this.rack_.emitter.on('add', this.onRackAdd_);
                this.rack_.emitter.on('itemlayout', this.onRackItemLayout_);
                this.rack_.emitter.on('remove', this.onRackRemove_);
                this.doc_ = doc;
                this.view = new FolderView(this.doc_, {
                    folder: this.folder,
                });
                this.view.titleElement.addEventListener('click', this.onTitleClick_);
                this.view.containerElement.addEventListener('transitionend', this.onContainerTransitionEnd_);
                setUpBladeView(this.view, this.blade);
            }
            Object.defineProperty(FolderController.prototype, "document", {
                get: function () {
                    return this.doc_;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(FolderController.prototype, "bladeRack", {
                get: function () {
                    return this.rack_;
                },
                enumerable: false,
                configurable: true
            });
            FolderController.prototype.onFolderBeforeChange_ = function (ev) {
                if (ev.propertyName !== 'expanded') {
                    return;
                }
                if (isEmpty(this.folder.expandedHeight)) {
                    this.folder.expandedHeight = computeExpandedFolderHeight(this.folder, this.view.containerElement);
                }
                this.folder.shouldFixHeight = true;
                forceReflow(this.view.containerElement);
            };
            FolderController.prototype.onTitleClick_ = function () {
                this.folder.expanded = !this.folder.expanded;
            };
            FolderController.prototype.applyRackChange_ = function () {
                updateAllItemsPositions(this.bladeRack);
            };
            FolderController.prototype.onRackAdd_ = function (ev) {
                insertElementAt(this.view.containerElement, ev.blade.view.element, ev.index);
                this.applyRackChange_();
            };
            FolderController.prototype.onRackRemove_ = function (_) {
                this.applyRackChange_();
            };
            FolderController.prototype.onRackItemLayout_ = function (_) {
                this.applyRackChange_();
            };
            FolderController.prototype.onContainerTransitionEnd_ = function (ev) {
                if (ev.propertyName !== 'height') {
                    return;
                }
                this.folder.shouldFixHeight = false;
                this.folder.expandedHeight = null;
            };
            return FolderController;
        }());

        var className$4 = ClassName('spt');
        /**
         * @hidden
         */
        var SeparatorView = /** @class */ (function () {
            function SeparatorView(doc) {
                this.element = doc.createElement('div');
                this.element.classList.add(className$4());
                var hrElem = doc.createElement('hr');
                hrElem.classList.add(className$4('r'));
                this.element.appendChild(hrElem);
            }
            return SeparatorView;
        }());

        /**
         * @hidden
         */
        var SeparatorController = /** @class */ (function () {
            function SeparatorController(doc, config) {
                this.blade = config.blade;
                this.view = new SeparatorView(doc);
                setUpBladeView(this.view, this.blade);
            }
            return SeparatorController;
        }());

        var ButtonApi = /** @class */ (function () {
            /**
             * @hidden
             */
            function ButtonApi(buttonController) {
                this.controller = buttonController;
            }
            Object.defineProperty(ButtonApi.prototype, "hidden", {
                get: function () {
                    return this.controller.blade.hidden;
                },
                set: function (hidden) {
                    this.controller.blade.hidden = hidden;
                },
                enumerable: false,
                configurable: true
            });
            ButtonApi.prototype.dispose = function () {
                this.controller.blade.dispose();
            };
            ButtonApi.prototype.on = function (eventName, handler) {
                var emitter = this.controller.button.emitter;
                // TODO: Type-safe
                emitter.on(eventName, forceCast(handler.bind(this)));
                return this;
            };
            return ButtonApi;
        }());

        /**
         * @hidden
         */
        function handleInputBinding(_a) {
            var binding = _a.binding, eventName = _a.eventName, handler = _a.handler;
            if (eventName === 'change') {
                var emitter = binding.emitter;
                emitter.on('change', function (ev) {
                    handler(forceCast(ev.sender.target.read()));
                });
            }
        }
        /**
         * @hidden
         */
        function handleMonitorBinding(_a) {
            var binding = _a.binding, eventName = _a.eventName, handler = _a.handler;
            if (eventName === 'update') {
                var emitter = binding.emitter;
                emitter.on('update', function (ev) {
                    handler(ev.sender.target.read());
                });
            }
        }
        /**
         * @hidden
         */
        function handleFolder(_a) {
            var bladeRack = _a.bladeRack, eventName = _a.eventName, folder = _a.folder, handler = _a.handler;
            if (eventName === 'change') {
                var emitter = bladeRack.emitter;
                emitter.on('inputchange', function (ev) {
                    handler(ev.inputBinding.target.read());
                });
            }
            if (eventName === 'update') {
                var emitter = bladeRack.emitter;
                emitter.on('monitorupdate', function (ev) {
                    handler(ev.monitorBinding.target.read());
                });
            }
            if (eventName === 'fold') {
                bladeRack.emitter.on('itemfold', function (ev) {
                    handler(ev.expanded);
                });
                folder === null || folder === void 0 ? void 0 : folder.emitter.on('change', function (ev) {
                    if (ev.propertyName !== 'expanded') {
                        return;
                    }
                    handler(ev.sender.expanded);
                });
            }
        }

        /**
         * The API for the input binding between the parameter and the pane.
         * @param In The internal type.
         * @param Ex The external type (= parameter object).
         */
        var InputBindingApi = /** @class */ (function () {
            /**
             * @hidden
             */
            function InputBindingApi(bindingController) {
                this.controller = bindingController;
            }
            Object.defineProperty(InputBindingApi.prototype, "hidden", {
                get: function () {
                    return this.controller.blade.hidden;
                },
                set: function (hidden) {
                    this.controller.blade.hidden = hidden;
                },
                enumerable: false,
                configurable: true
            });
            InputBindingApi.prototype.dispose = function () {
                this.controller.blade.dispose();
            };
            InputBindingApi.prototype.on = function (eventName, handler) {
                handleInputBinding({
                    binding: this.controller.binding,
                    eventName: eventName,
                    handler: handler.bind(this),
                });
                return this;
            };
            InputBindingApi.prototype.refresh = function () {
                this.controller.binding.read();
            };
            return InputBindingApi;
        }());

        var CREATE_MESSAGE_MAP = {
            alreadydisposed: function () { return 'View has been already disposed'; },
            invalidparams: function (context) { return "Invalid parameters for '" + context.name + "'"; },
            nomatchingcontroller: function (context) {
                return "No matching controller for '" + context.key + "'";
            },
            notbindable: function () { return "Value is not bindable"; },
            propertynotfound: function (context) { return "Property '" + context.name + "' not found"; },
            shouldneverhappen: function () { return 'This error should never happen'; },
        };
        var TpError = /** @class */ (function () {
            function TpError(config) {
                var _a;
                this.message = (_a = CREATE_MESSAGE_MAP[config.type](forceCast(config.context))) !== null && _a !== void 0 ? _a : 'Unexpected error';
                this.name = this.constructor.name;
                this.stack = new Error(this.message).stack;
                this.type = config.type;
            }
            TpError.alreadyDisposed = function () {
                return new TpError({ context: {}, type: 'alreadydisposed' });
            };
            TpError.notBindable = function () {
                return new TpError({
                    context: {},
                    type: 'notbindable',
                });
            };
            TpError.propertyNotFound = function (name) {
                return new TpError({
                    type: 'propertynotfound',
                    context: {
                        name: name,
                    },
                });
            };
            TpError.shouldNeverHappen = function () {
                return new TpError({ context: {}, type: 'shouldneverhappen' });
            };
            return TpError;
        }());
        TpError.prototype = Object.create(Error.prototype);
        TpError.prototype.constructor = TpError;

        /**
         * @hidden
         */
        var InputBinding = /** @class */ (function () {
            function InputBinding(config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.reader = config.reader;
                this.writer = config.writer;
                this.emitter = new Emitter();
                this.value = config.value;
                this.value.emitter.on('change', this.onValueChange_);
                this.target = config.target;
                this.read();
            }
            InputBinding.prototype.read = function () {
                var targetValue = this.target.read();
                if (targetValue !== undefined) {
                    this.value.rawValue = this.reader(targetValue);
                }
            };
            InputBinding.prototype.write_ = function (rawValue) {
                this.writer(this.target, rawValue);
            };
            InputBinding.prototype.onValueChange_ = function (ev) {
                this.write_(ev.rawValue);
                this.emitter.emit('change', {
                    rawValue: ev.rawValue,
                    sender: this,
                });
            };
            return InputBinding;
        }());

        /**
         * @hidden
         */
        var Value = /** @class */ (function () {
            function Value(initialValue, config) {
                var _a;
                this.constraint_ = config === null || config === void 0 ? void 0 : config.constraint;
                this.equals_ = (_a = config === null || config === void 0 ? void 0 : config.equals) !== null && _a !== void 0 ? _a : (function (v1, v2) { return v1 === v2; });
                this.emitter = new Emitter();
                this.rawValue_ = initialValue;
            }
            Object.defineProperty(Value.prototype, "constraint", {
                get: function () {
                    return this.constraint_;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Value.prototype, "rawValue", {
                get: function () {
                    return this.rawValue_;
                },
                set: function (rawValue) {
                    var constrainedValue = this.constraint_
                        ? this.constraint_.constrain(rawValue)
                        : rawValue;
                    var changed = !this.equals_(this.rawValue_, constrainedValue);
                    if (changed) {
                        this.rawValue_ = constrainedValue;
                        this.emitter.emit('change', {
                            rawValue: constrainedValue,
                            sender: this,
                        });
                    }
                },
                enumerable: false,
                configurable: true
            });
            return Value;
        }());

        function createController(plugin, args) {
            var initialValue = plugin.binding.accept(args.target.read(), args.params);
            if (initialValue === null) {
                return null;
            }
            var valueArgs = {
                target: args.target,
                initialValue: initialValue,
                params: args.params,
            };
            var reader = plugin.binding.reader(valueArgs);
            var constraint = plugin.binding.constraint
                ? plugin.binding.constraint(valueArgs)
                : undefined;
            var value = new Value(reader(initialValue), {
                constraint: constraint,
                equals: plugin.binding.equals,
            });
            var binding = new InputBinding({
                reader: reader,
                target: args.target,
                value: value,
                writer: plugin.binding.writer(valueArgs),
            });
            var controller = plugin.controller({
                binding: binding,
                document: args.document,
                initialValue: initialValue,
                params: args.params,
            });
            return new InputBindingController(args.document, {
                binding: binding,
                controller: controller,
                label: args.params.label || args.target.key,
                blade: new Blade(),
            });
        }

        /**
         * @hidden
         */
        function createInputBindingController(document, target, params) {
            var initialValue = target.read();
            if (isEmpty(initialValue)) {
                throw new TpError({
                    context: {
                        key: target.key,
                    },
                    type: 'nomatchingcontroller',
                });
            }
            var bc = Plugins.inputs.reduce(function (result, plugin) {
                return result ||
                    createController(plugin, {
                        document: document,
                        target: target,
                        params: params,
                    });
            }, null);
            if (bc) {
                return bc;
            }
            throw new TpError({
                context: {
                    key: target.key,
                },
                type: 'nomatchingcontroller',
            });
        }

        /**
         * The API for the monitor binding between the parameter and the pane.
         */
        var MonitorBindingApi = /** @class */ (function () {
            /**
             * @hidden
             */
            function MonitorBindingApi(bindingController) {
                this.controller = bindingController;
            }
            Object.defineProperty(MonitorBindingApi.prototype, "hidden", {
                get: function () {
                    return this.controller.blade.hidden;
                },
                set: function (hidden) {
                    this.controller.blade.hidden = hidden;
                },
                enumerable: false,
                configurable: true
            });
            MonitorBindingApi.prototype.dispose = function () {
                this.controller.blade.dispose();
            };
            MonitorBindingApi.prototype.on = function (eventName, handler) {
                handleMonitorBinding({
                    binding: this.controller.binding,
                    eventName: eventName,
                    // TODO: Type-safe
                    handler: forceCast(handler.bind(this)),
                });
                return this;
            };
            MonitorBindingApi.prototype.refresh = function () {
                this.controller.binding.read();
            };
            return MonitorBindingApi;
        }());

        var Constants = {
            monitor: {
                defaultInterval: 200,
                defaultLineCount: 3,
            },
        };

        function fillBuffer(buffer, bufferSize) {
            while (buffer.length < bufferSize) {
                buffer.push(undefined);
            }
        }
        /**
         * @hidden
         */
        function initializeBuffer(initialValue, bufferSize) {
            var buffer = [initialValue];
            fillBuffer(buffer, bufferSize);
            return new Value(buffer);
        }
        function createTrimmedBuffer(buffer) {
            var index = buffer.indexOf(undefined);
            return forceCast(index < 0 ? buffer : buffer.slice(0, index));
        }
        /**
         * @hidden
         */
        function createPushedBuffer(buffer, newValue) {
            var newBuffer = __spreadArrays(createTrimmedBuffer(buffer), [newValue]);
            if (newBuffer.length > buffer.length) {
                newBuffer.splice(0, newBuffer.length - buffer.length);
            }
            else {
                fillBuffer(newBuffer, buffer.length);
            }
            return newBuffer;
        }

        /**
         * @hidden
         */
        var MonitorBinding = /** @class */ (function () {
            function MonitorBinding(config) {
                this.onTick_ = this.onTick_.bind(this);
                this.reader_ = config.reader;
                this.target = config.target;
                this.emitter = new Emitter();
                this.value = config.value;
                this.ticker = config.ticker;
                this.ticker.emitter.on('tick', this.onTick_);
                this.read();
            }
            MonitorBinding.prototype.dispose = function () {
                this.ticker.disposable.dispose();
            };
            MonitorBinding.prototype.read = function () {
                var targetValue = this.target.read();
                if (targetValue === undefined) {
                    return;
                }
                var buffer = this.value.rawValue;
                var newValue = this.reader_(targetValue);
                this.value.rawValue = createPushedBuffer(buffer, newValue);
                this.emitter.emit('update', {
                    rawValue: newValue,
                    sender: this,
                });
            };
            MonitorBinding.prototype.onTick_ = function (_) {
                this.read();
            };
            return MonitorBinding;
        }());

        /**
         * @hidden
         */
        var IntervalTicker = /** @class */ (function () {
            function IntervalTicker(doc, interval) {
                var _this = this;
                this.id_ = null;
                this.onTick_ = this.onTick_.bind(this);
                // this.onWindowBlur_ = this.onWindowBlur_.bind(this);
                // this.onWindowFocus_ = this.onWindowFocus_.bind(this);
                this.doc_ = doc;
                this.emitter = new Emitter();
                if (interval <= 0) {
                    this.id_ = null;
                }
                else {
                    var win = this.doc_.defaultView;
                    if (win) {
                        this.id_ = win.setInterval(this.onTick_, interval);
                    }
                }
                // TODO: Stop on blur?
                // const win = document.defaultView;
                // if (win) {
                //   win.addEventListener('blur', this.onWindowBlur_);
                //   win.addEventListener('focus', this.onWindowFocus_);
                // }
                this.disposable = new Disposable();
                this.disposable.emitter.on('dispose', function () {
                    if (_this.id_ !== null) {
                        var win = _this.doc_.defaultView;
                        if (win) {
                            win.clearInterval(_this.id_);
                        }
                    }
                    _this.id_ = null;
                });
            }
            IntervalTicker.prototype.onTick_ = function () {
                // if (!this.active_) {
                // 	return;
                // }
                this.emitter.emit('tick', {
                    sender: this,
                });
            };
            return IntervalTicker;
        }());

        /**
         * @hidden
         */
        var ManualTicker = /** @class */ (function () {
            function ManualTicker() {
                this.disposable = new Disposable();
                this.emitter = new Emitter();
            }
            ManualTicker.prototype.tick = function () {
                this.emitter.emit('tick', {
                    sender: this,
                });
            };
            return ManualTicker;
        }());

        function createTicker(document, interval) {
            return interval === 0
                ? new ManualTicker()
                : new IntervalTicker(document, interval !== null && interval !== void 0 ? interval : Constants.monitor.defaultInterval);
        }
        function createController$1(plugin, args) {
            var _a, _b, _c;
            var initialValue = plugin.binding.accept(args.target.read(), args.params);
            if (initialValue === null) {
                return null;
            }
            var valueArgs = {
                target: args.target,
                initialValue: initialValue,
                params: args.params,
            };
            var reader = plugin.binding.reader(valueArgs);
            var bufferSize = (_c = (_b = (_a = args.params.bufferSize) !== null && _a !== void 0 ? _a : args.params.count) !== null && _b !== void 0 ? _b : (plugin.binding.defaultBufferSize &&
                plugin.binding.defaultBufferSize(args.params))) !== null && _c !== void 0 ? _c : 1;
            var binding = new MonitorBinding({
                reader: reader,
                target: args.target,
                ticker: createTicker(args.document, args.params.interval),
                value: initializeBuffer(reader(initialValue), bufferSize),
            });
            return new MonitorBindingController(args.document, {
                binding: binding,
                controller: plugin.controller({
                    binding: binding,
                    document: args.document,
                    params: args.params,
                }),
                label: args.params.label || args.target.key,
                blade: new Blade(),
            });
        }

        /**
         * @hidden
         */
        function createMonitorBindingController(document, target, params) {
            var bc = Plugins.monitors.reduce(function (result, plugin) {
                return result ||
                    createController$1(plugin, {
                        document: document,
                        params: params,
                        target: target,
                    });
            }, null);
            if (bc) {
                return bc;
            }
            throw new TpError({
                context: {
                    key: target.key,
                },
                type: 'nomatchingcontroller',
            });
        }

        var SeparatorApi = /** @class */ (function () {
            /**
             * @hidden
             */
            function SeparatorApi(controller) {
                this.controller = controller;
            }
            Object.defineProperty(SeparatorApi.prototype, "hidden", {
                get: function () {
                    return this.controller.blade.hidden;
                },
                set: function (hidden) {
                    this.controller.blade.hidden = hidden;
                },
                enumerable: false,
                configurable: true
            });
            SeparatorApi.prototype.dispose = function () {
                this.controller.blade.dispose();
            };
            return SeparatorApi;
        }());

        /**
         * @hidden
         */
        var BindingTarget = /** @class */ (function () {
            function BindingTarget(obj, key, opt_id) {
                this.obj_ = obj;
                this.key_ = key;
                this.presetKey_ = opt_id !== null && opt_id !== void 0 ? opt_id : key;
            }
            BindingTarget.isBindable = function (obj) {
                if (obj === null) {
                    return false;
                }
                if (typeof obj !== 'object') {
                    return false;
                }
                return true;
            };
            Object.defineProperty(BindingTarget.prototype, "key", {
                get: function () {
                    return this.key_;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(BindingTarget.prototype, "presetKey", {
                get: function () {
                    return this.presetKey_;
                },
                enumerable: false,
                configurable: true
            });
            BindingTarget.prototype.read = function () {
                return this.obj_[this.key_];
            };
            BindingTarget.prototype.write = function (value) {
                this.obj_[this.key_] = value;
            };
            BindingTarget.prototype.writeProperty = function (name, value) {
                var valueObj = this.read();
                if (!BindingTarget.isBindable(valueObj)) {
                    throw TpError.notBindable();
                }
                if (!(name in valueObj)) {
                    throw TpError.propertyNotFound(name);
                }
                valueObj[name] = value;
            };
            return BindingTarget;
        }());

        function createBindingTarget(obj, key, opt_id) {
            if (!BindingTarget.isBindable(obj)) {
                throw TpError.notBindable();
            }
            return new BindingTarget(obj, key, opt_id);
        }

        var FolderApi = /** @class */ (function () {
            /**
             * @hidden
             */
            function FolderApi(folderController) {
                this.controller = folderController;
            }
            Object.defineProperty(FolderApi.prototype, "expanded", {
                get: function () {
                    return this.controller.folder.expanded;
                },
                set: function (expanded) {
                    this.controller.folder.expanded = expanded;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(FolderApi.prototype, "hidden", {
                get: function () {
                    return this.controller.blade.hidden;
                },
                set: function (hidden) {
                    this.controller.blade.hidden = hidden;
                },
                enumerable: false,
                configurable: true
            });
            FolderApi.prototype.dispose = function () {
                this.controller.blade.dispose();
            };
            FolderApi.prototype.addInput = function (object, key, opt_params) {
                var params = opt_params || {};
                var bc = createInputBindingController(this.controller.document, createBindingTarget(object, key, params.presetKey), params);
                this.controller.bladeRack.add(bc, params.index);
                return new InputBindingApi(forceCast(bc));
            };
            FolderApi.prototype.addMonitor = function (object, key, opt_params) {
                var params = opt_params || {};
                var bc = createMonitorBindingController(this.controller.document, createBindingTarget(object, key), params);
                this.controller.bladeRack.add(bc, params.index);
                return new MonitorBindingApi(forceCast(bc));
            };
            FolderApi.prototype.addFolder = function (params) {
                var bc = new FolderController(this.controller.document, __assign(__assign({}, params), { blade: new Blade() }));
                this.controller.bladeRack.add(bc, params.index);
                return new FolderApi(bc);
            };
            FolderApi.prototype.addButton = function (params) {
                var bc = new ButtonController(this.controller.document, __assign(__assign({}, params), { blade: new Blade() }));
                this.controller.bladeRack.add(bc, params.index);
                return new ButtonApi(bc);
            };
            FolderApi.prototype.addSeparator = function (opt_params) {
                var params = opt_params || {};
                var bc = new SeparatorController(this.controller.document, {
                    blade: new Blade(),
                });
                this.controller.bladeRack.add(bc, params.index);
                return new SeparatorApi(bc);
            };
            FolderApi.prototype.on = function (eventName, handler) {
                handleFolder({
                    eventName: eventName,
                    folder: this.controller.folder,
                    // TODO: Type-safe
                    handler: forceCast(handler.bind(this)),
                    bladeRack: this.controller.bladeRack,
                });
                return this;
            };
            return FolderApi;
        }());

        /**
         * @hidden
         */
        function exportPresetJson(targets) {
            return targets.reduce(function (result, target) {
                var _a;
                return Object.assign(result, (_a = {},
                    _a[target.presetKey] = target.read(),
                    _a));
            }, {});
        }
        /**
         * @hidden
         */
        function importPresetJson(targets, preset) {
            targets.forEach(function (target) {
                var value = preset[target.presetKey];
                if (value !== undefined) {
                    target.write(value);
                }
            });
        }

        /**
         * The Tweakpane interface.
         *
         * ```
         * new Tweakpane(options: TweakpaneConfig): RootApi
         * ```
         *
         * See [[`TweakpaneConfig`]] interface for available options.
         */
        var RootApi = /** @class */ (function () {
            /**
             * @hidden
             */
            function RootApi(rootController) {
                this.controller = rootController;
            }
            // TODO: Publish
            /**
             * @hidden
             */
            RootApi.registerPlugin = function (r) {
                if (r.type === 'input') {
                    Plugins.inputs.unshift(r.plugin);
                }
                else if (r.type === 'monitor') {
                    Plugins.monitors.unshift(r.plugin);
                }
            };
            Object.defineProperty(RootApi.prototype, "element", {
                get: function () {
                    return this.controller.view.element;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(RootApi.prototype, "expanded", {
                get: function () {
                    var folder = this.controller.folder;
                    return folder ? folder.expanded : true;
                },
                set: function (expanded) {
                    var folder = this.controller.folder;
                    if (folder) {
                        folder.expanded = expanded;
                    }
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(RootApi.prototype, "hidden", {
                get: function () {
                    return this.controller.blade.hidden;
                },
                set: function (hidden) {
                    this.controller.blade.hidden = hidden;
                },
                enumerable: false,
                configurable: true
            });
            RootApi.prototype.dispose = function () {
                this.controller.blade.dispose();
            };
            RootApi.prototype.addInput = function (object, key, opt_params) {
                var params = opt_params || {};
                var bc = createInputBindingController(this.controller.document, createBindingTarget(object, key, params.presetKey), params);
                this.controller.bladeRack.add(bc, params.index);
                return new InputBindingApi(forceCast(bc));
            };
            RootApi.prototype.addMonitor = function (object, key, opt_params) {
                var params = opt_params || {};
                var bc = createMonitorBindingController(this.controller.document, createBindingTarget(object, key), params);
                this.controller.bladeRack.add(bc, params.index);
                return new MonitorBindingApi(forceCast(bc));
            };
            RootApi.prototype.addButton = function (params) {
                var bc = new ButtonController(this.controller.document, __assign(__assign({}, params), { blade: new Blade() }));
                this.controller.bladeRack.add(bc, params.index);
                return new ButtonApi(bc);
            };
            RootApi.prototype.addFolder = function (params) {
                var bc = new FolderController(this.controller.document, __assign(__assign({}, params), { blade: new Blade() }));
                this.controller.bladeRack.add(bc, params.index);
                return new FolderApi(bc);
            };
            RootApi.prototype.addSeparator = function (opt_params) {
                var params = opt_params || {};
                var bc = new SeparatorController(this.controller.document, {
                    blade: new Blade(),
                });
                this.controller.bladeRack.add(bc, params.index);
                return new SeparatorApi(bc);
            };
            /**
             * Import a preset of all inputs.
             * @param preset The preset object to import.
             */
            RootApi.prototype.importPreset = function (preset) {
                var targets = this.controller.bladeRack
                    .find(InputBindingController)
                    .map(function (ibc) {
                    return ibc.binding.target;
                });
                importPresetJson(targets, preset);
                this.refresh();
            };
            /**
             * Export a preset of all inputs.
             * @return The exported preset object.
             */
            RootApi.prototype.exportPreset = function () {
                var targets = this.controller.bladeRack
                    .find(InputBindingController)
                    .map(function (ibc) {
                    return ibc.binding.target;
                });
                return exportPresetJson(targets);
            };
            /**
             * Adds a global event listener. It handles all events of child inputs/monitors.
             * @param eventName The event name to listen.
             * @return The API object itself.
             */
            RootApi.prototype.on = function (eventName, handler) {
                handleFolder({
                    eventName: eventName,
                    folder: this.controller.folder,
                    // TODO: Type-safe
                    handler: forceCast(handler.bind(this)),
                    bladeRack: this.controller.bladeRack,
                });
                return this;
            };
            /**
             * Refreshes all bindings of the pane.
             */
            RootApi.prototype.refresh = function () {
                // Force-read all input bindings
                this.controller.bladeRack.find(InputBindingController).forEach(function (ibc) {
                    ibc.binding.read();
                });
                // Force-read all monitor bindings
                this.controller.bladeRack.find(MonitorBindingController).forEach(function (mbc) {
                    mbc.binding.read();
                });
            };
            return RootApi;
        }());

        var className$5 = ClassName('rot');
        /**
         * @hidden
         */
        var RootView = /** @class */ (function () {
            function RootView(doc, config) {
                this.titleElem_ = null;
                this.onFolderChange_ = this.onFolderChange_.bind(this);
                this.folder_ = config.folder;
                if (this.folder_) {
                    this.folder_.emitter.on('change', this.onFolderChange_);
                }
                this.element = doc.createElement('div');
                this.element.classList.add(className$5());
                var folder = this.folder_;
                if (folder) {
                    var titleElem = doc.createElement('button');
                    titleElem.classList.add(className$5('t'));
                    titleElem.textContent = folder.title;
                    this.element.appendChild(titleElem);
                    var markElem = doc.createElement('div');
                    markElem.classList.add(className$5('m'));
                    titleElem.appendChild(markElem);
                    this.titleElem_ = titleElem;
                }
                var containerElem = doc.createElement('div');
                containerElem.classList.add(className$5('c'));
                this.element.appendChild(containerElem);
                this.containerElement = containerElem;
                this.applyModel_();
            }
            Object.defineProperty(RootView.prototype, "titleElement", {
                get: function () {
                    return this.titleElem_;
                },
                enumerable: false,
                configurable: true
            });
            RootView.prototype.applyModel_ = function () {
                var expanded = this.folder_ ? this.folder_.styleExpanded : true;
                var expandedClass = className$5(undefined, 'expanded');
                if (expanded) {
                    this.element.classList.add(expandedClass);
                }
                else {
                    this.element.classList.remove(expandedClass);
                }
                this.containerElement.style.height = this.folder_
                    ? this.folder_.styleHeight
                    : 'auto';
            };
            RootView.prototype.onFolderChange_ = function () {
                this.applyModel_();
            };
            return RootView;
        }());

        function createFolder(config) {
            var _a;
            if (!config.title) {
                return null;
            }
            return new Folder(config.title, (_a = config.expanded) !== null && _a !== void 0 ? _a : true);
        }
        /**
         * @hidden
         */
        var RootController = /** @class */ (function () {
            function RootController(doc, config) {
                this.onContainerTransitionEnd_ = this.onContainerTransitionEnd_.bind(this);
                this.onFolderBeforeChange_ = this.onFolderBeforeChange_.bind(this);
                this.onTitleClick_ = this.onTitleClick_.bind(this);
                this.onRackAdd_ = this.onRackAdd_.bind(this);
                this.onRackItemLayout_ = this.onRackItemLayout_.bind(this);
                this.onRackRemove_ = this.onRackRemove_.bind(this);
                this.folder = createFolder(config);
                if (this.folder) {
                    this.folder.emitter.on('beforechange', this.onFolderBeforeChange_);
                }
                this.bladeRack = new BladeRack();
                this.bladeRack.emitter.on('add', this.onRackAdd_);
                this.bladeRack.emitter.on('itemlayout', this.onRackItemLayout_);
                this.bladeRack.emitter.on('remove', this.onRackRemove_);
                this.doc_ = doc;
                this.blade = config.blade;
                this.view = new RootView(this.doc_, {
                    folder: this.folder,
                });
                if (this.view.titleElement) {
                    this.view.titleElement.addEventListener('click', this.onTitleClick_);
                }
                this.view.containerElement.addEventListener('transitionend', this.onContainerTransitionEnd_);
                setUpBladeView(this.view, this.blade);
            }
            Object.defineProperty(RootController.prototype, "document", {
                get: function () {
                    return this.doc_;
                },
                enumerable: false,
                configurable: true
            });
            RootController.prototype.onFolderBeforeChange_ = function (ev) {
                if (ev.propertyName !== 'expanded') {
                    return;
                }
                var folder = this.folder;
                if (!folder) {
                    return;
                }
                if (isEmpty(folder.expandedHeight)) {
                    folder.expandedHeight = computeExpandedFolderHeight(folder, this.view.containerElement);
                }
                folder.shouldFixHeight = true;
                forceReflow(this.view.containerElement);
            };
            RootController.prototype.applyRackChange_ = function () {
                updateAllItemsPositions(this.bladeRack);
            };
            RootController.prototype.onRackAdd_ = function (ev) {
                insertElementAt(this.view.containerElement, ev.blade.view.element, ev.index);
                this.applyRackChange_();
            };
            RootController.prototype.onRackRemove_ = function (_) {
                this.applyRackChange_();
            };
            RootController.prototype.onRackItemLayout_ = function (_) {
                this.applyRackChange_();
            };
            RootController.prototype.onTitleClick_ = function () {
                if (this.folder) {
                    this.folder.expanded = !this.folder.expanded;
                }
            };
            RootController.prototype.onContainerTransitionEnd_ = function (ev) {
                if (ev.propertyName !== 'height') {
                    return;
                }
                if (this.folder) {
                    this.folder.shouldFixHeight = false;
                    this.folder.expandedHeight = null;
                }
            };
            return RootController;
        }());

        /**
         * @hidden
         */
        var CompositeConstraint = /** @class */ (function () {
            function CompositeConstraint(config) {
                this.constraints_ = config.constraints;
            }
            Object.defineProperty(CompositeConstraint.prototype, "constraints", {
                get: function () {
                    return this.constraints_;
                },
                enumerable: false,
                configurable: true
            });
            CompositeConstraint.prototype.constrain = function (value) {
                return this.constraints_.reduce(function (result, c) {
                    return c.constrain(result);
                }, value);
            };
            return CompositeConstraint;
        }());
        function findConstraint(c, constraintClass) {
            if (c instanceof constraintClass) {
                return c;
            }
            if (c instanceof CompositeConstraint) {
                var result = c.constraints.reduce(function (tmpResult, sc) {
                    if (tmpResult) {
                        return tmpResult;
                    }
                    return sc instanceof constraintClass ? sc : null;
                }, null);
                if (result) {
                    return result;
                }
            }
            return null;
        }

        /**
         * @hidden
         */
        var ListConstraint = /** @class */ (function () {
            function ListConstraint(config) {
                this.opts_ = config.options;
            }
            Object.defineProperty(ListConstraint.prototype, "options", {
                get: function () {
                    return this.opts_;
                },
                enumerable: false,
                configurable: true
            });
            ListConstraint.prototype.constrain = function (value) {
                var opts = this.opts_;
                if (opts.length === 0) {
                    return value;
                }
                var matched = opts.filter(function (item) {
                    return item.value === value;
                }).length > 0;
                return matched ? value : opts[0].value;
            };
            return ListConstraint;
        }());

        /**
         * @hidden
         */
        function boolToString(value) {
            return String(value);
        }
        /**
         * @hidden
         */
        function boolFromUnknown(value) {
            if (value === 'false') {
                return false;
            }
            return !!value;
        }
        /**
         * @hidden
         */
        function BooleanFormatter(value) {
            return boolToString(value);
        }

        function writePrimitive(target, value) {
            target.write(value);
        }

        /**
         * @hidden
         */
        var StepConstraint = /** @class */ (function () {
            function StepConstraint(config) {
                this.step = config.step;
            }
            StepConstraint.prototype.constrain = function (value) {
                var r = value < 0
                    ? -Math.round(-value / this.step)
                    : Math.round(value / this.step);
                return r * this.step;
            };
            return StepConstraint;
        }());

        function mapRange(value, start1, end1, start2, end2) {
            var p = (value - start1) / (end1 - start1);
            return start2 + p * (end2 - start2);
        }
        function getDecimalDigits(value) {
            var text = String(value.toFixed(10));
            var frac = text.split('.')[1];
            return frac.replace(/0+$/, '').length;
        }
        function constrainRange(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }
        function loopRange(value, max) {
            return ((value % max) + max) % max;
        }

        /**
         * @hidden
         */
        function normalizeInputParamsOptions(options, convert) {
            if (Array.isArray(options)) {
                return options.map(function (item) {
                    return {
                        text: item.text,
                        value: convert(item.value),
                    };
                });
            }
            var textToValueMap = options;
            var texts = Object.keys(textToValueMap);
            return texts.reduce(function (result, text) {
                return result.concat({
                    text: text,
                    value: convert(textToValueMap[text]),
                });
            }, []);
        }
        /**
         * @hidden
         */
        function findListItems(constraint) {
            var c = constraint
                ? findConstraint(constraint, ListConstraint)
                : null;
            if (!c) {
                return null;
            }
            return c.options;
        }
        function findStep(constraint) {
            var c = constraint ? findConstraint(constraint, StepConstraint) : null;
            if (!c) {
                return null;
            }
            return c.step;
        }
        /**
         * @hidden
         */
        function getSuitableDecimalDigits(constraint, rawValue) {
            var sc = constraint && findConstraint(constraint, StepConstraint);
            if (sc) {
                return getDecimalDigits(sc.step);
            }
            return Math.max(getDecimalDigits(rawValue), 2);
        }
        /**
         * @hidden
         */
        function getBaseStep(constraint) {
            var step = findStep(constraint);
            return step !== null && step !== void 0 ? step : 1;
        }

        var className$6 = ClassName('lst');
        /**
         * @hidden
         */
        var ListView = /** @class */ (function () {
            function ListView(doc, config) {
                var _this = this;
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.element = doc.createElement('div');
                this.element.classList.add(className$6());
                this.stringifyValue_ = config.stringifyValue;
                var selectElem = doc.createElement('select');
                selectElem.classList.add(className$6('s'));
                config.options.forEach(function (item, index) {
                    var optionElem = doc.createElement('option');
                    optionElem.dataset.index = String(index);
                    optionElem.textContent = item.text;
                    optionElem.value = _this.stringifyValue_(item.value);
                    selectElem.appendChild(optionElem);
                });
                this.element.appendChild(selectElem);
                this.selectElement = selectElem;
                var markElem = doc.createElement('div');
                markElem.classList.add(className$6('m'));
                this.element.appendChild(markElem);
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.update();
            }
            ListView.prototype.update = function () {
                this.selectElement.value = this.stringifyValue_(this.value.rawValue);
            };
            ListView.prototype.onValueChange_ = function () {
                this.update();
            };
            return ListView;
        }());

        /**
         * @hidden
         */
        var ListController = /** @class */ (function () {
            function ListController(doc, config) {
                this.onSelectChange_ = this.onSelectChange_.bind(this);
                this.value = config.value;
                this.listItems_ = config.listItems;
                this.view = new ListView(doc, {
                    options: this.listItems_,
                    stringifyValue: config.stringifyValue,
                    value: this.value,
                });
                this.view.selectElement.addEventListener('change', this.onSelectChange_);
            }
            ListController.prototype.onSelectChange_ = function (e) {
                var selectElem = forceCast(e.currentTarget);
                var optElem = selectElem.selectedOptions.item(0);
                if (!optElem) {
                    return;
                }
                var itemIndex = Number(optElem.dataset.index);
                this.value.rawValue = this.listItems_[itemIndex].value;
                this.view.update();
            };
            return ListController;
        }());

        var className$7 = ClassName('ckb');
        /**
         * @hidden
         */
        var CheckboxView = /** @class */ (function () {
            function CheckboxView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.element = doc.createElement('div');
                this.element.classList.add(className$7());
                var labelElem = doc.createElement('label');
                labelElem.classList.add(className$7('l'));
                this.element.appendChild(labelElem);
                var inputElem = doc.createElement('input');
                inputElem.classList.add(className$7('i'));
                inputElem.type = 'checkbox';
                labelElem.appendChild(inputElem);
                this.inputElement = inputElem;
                var markElem = doc.createElement('div');
                markElem.classList.add(className$7('m'));
                labelElem.appendChild(markElem);
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.update();
            }
            CheckboxView.prototype.update = function () {
                this.inputElement.checked = this.value.rawValue;
            };
            CheckboxView.prototype.onValueChange_ = function () {
                this.update();
            };
            return CheckboxView;
        }());

        /**
         * @hidden
         */
        var CheckboxController = /** @class */ (function () {
            function CheckboxController(doc, config) {
                this.onInputChange_ = this.onInputChange_.bind(this);
                this.value = config.value;
                this.view = new CheckboxView(doc, {
                    value: this.value,
                });
                this.view.inputElement.addEventListener('change', this.onInputChange_);
            }
            CheckboxController.prototype.onInputChange_ = function (e) {
                var inputElem = forceCast(e.currentTarget);
                this.value.rawValue = inputElem.checked;
                this.view.update();
            };
            return CheckboxController;
        }());

        function createConstraint(params) {
            var constraints = [];
            if ('options' in params && params.options !== undefined) {
                constraints.push(new ListConstraint({
                    options: normalizeInputParamsOptions(params.options, boolFromUnknown),
                }));
            }
            return new CompositeConstraint({
                constraints: constraints,
            });
        }
        function createController$2(doc, value) {
            var _a;
            var c = value.constraint;
            if (c && findConstraint(c, ListConstraint)) {
                return new ListController(doc, {
                    listItems: (_a = findListItems(c)) !== null && _a !== void 0 ? _a : [],
                    stringifyValue: boolToString,
                    value: value,
                });
            }
            return new CheckboxController(doc, {
                value: value,
            });
        }
        /**
         * @hidden
         */
        var BooleanInputPlugin = {
            id: 'input-bool',
            binding: {
                accept: function (value) { return (typeof value === 'boolean' ? value : null); },
                constraint: function (args) { return createConstraint(args.params); },
                reader: function (_args) { return boolFromUnknown; },
                writer: function (_args) { return writePrimitive; },
            },
            controller: function (args) {
                return createController$2(args.document, args.binding.value);
            },
        };

        var className$8 = ClassName('txt');
        /**
         * @hidden
         */
        var TextView = /** @class */ (function () {
            function TextView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.formatter_ = config.formatter;
                this.element = doc.createElement('div');
                this.element.classList.add(className$8());
                var inputElem = doc.createElement('input');
                inputElem.classList.add(className$8('i'));
                inputElem.type = 'text';
                this.element.appendChild(inputElem);
                this.inputElement = inputElem;
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.update();
            }
            TextView.prototype.update = function () {
                this.inputElement.value = this.formatter_(this.value.rawValue);
            };
            TextView.prototype.onValueChange_ = function () {
                this.update();
            };
            return TextView;
        }());

        /**
         * @hidden
         */
        var TextController = /** @class */ (function () {
            function TextController(doc, config) {
                this.onInputChange_ = this.onInputChange_.bind(this);
                this.parser_ = config.parser;
                this.value = config.value;
                this.view = new TextView(doc, {
                    formatter: config.formatter,
                    value: this.value,
                });
                this.view.inputElement.addEventListener('change', this.onInputChange_);
            }
            TextController.prototype.onInputChange_ = function (e) {
                var inputElem = forceCast(e.currentTarget);
                var value = inputElem.value;
                var parsedValue = this.parser_(value);
                if (!isEmpty(parsedValue)) {
                    this.value.rawValue = parsedValue;
                }
                this.view.update();
            };
            return TextController;
        }());

        var className$9 = ClassName('cswtxt');
        /**
         * @hidden
         */
        var ColorSwatchTextView = /** @class */ (function () {
            function ColorSwatchTextView(doc, config) {
                this.element = doc.createElement('div');
                this.element.classList.add(className$9());
                var swatchElem = doc.createElement('div');
                swatchElem.classList.add(className$9('s'));
                this.swatchView_ = config.swatchView;
                swatchElem.appendChild(this.swatchView_.element);
                this.element.appendChild(swatchElem);
                var textElem = doc.createElement('div');
                textElem.classList.add(className$9('t'));
                this.textView = config.textView;
                textElem.appendChild(this.textView.element);
                this.element.appendChild(textElem);
            }
            Object.defineProperty(ColorSwatchTextView.prototype, "value", {
                get: function () {
                    return this.textView.value;
                },
                enumerable: false,
                configurable: true
            });
            ColorSwatchTextView.prototype.update = function () {
                this.swatchView_.update();
                this.textView.update();
            };
            return ColorSwatchTextView;
        }());

        var PickedColor = /** @class */ (function () {
            function PickedColor(value) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.mode_ = value.rawValue.mode;
                this.value = value;
                this.value.emitter.on('change', this.onValueChange_);
                this.emitter = new Emitter();
            }
            Object.defineProperty(PickedColor.prototype, "mode", {
                get: function () {
                    return this.mode_;
                },
                set: function (mode) {
                    if (this.mode_ === mode) {
                        return;
                    }
                    this.mode_ = mode;
                    this.emitter.emit('change', {
                        propertyName: 'mode',
                        sender: this,
                    });
                },
                enumerable: false,
                configurable: true
            });
            PickedColor.prototype.onValueChange_ = function () {
                this.emitter.emit('change', {
                    propertyName: 'value',
                    sender: this,
                });
            };
            return PickedColor;
        }());

        /**
         * @hidden
         */
        function parseNumber(text) {
            var num = parseFloat(text);
            if (isNaN(num)) {
                return null;
            }
            return num;
        }
        /**
         * @hidden
         */
        function numberFromUnknown(value) {
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'string') {
                var pv = parseNumber(value);
                if (!isEmpty(pv)) {
                    return pv;
                }
            }
            return 0;
        }
        /**
         * @hidden
         */
        function numberToString(value) {
            return String(value);
        }
        /**
         * @hidden
         */
        function createNumberFormatter(digits) {
            return function (value) {
                return value.toFixed(Math.max(Math.min(digits, 20), 0));
            };
        }

        var innerFormatter = createNumberFormatter(0);
        /**
         * @hidden
         */
        function formatPercentage(value) {
            return innerFormatter(value) + '%';
        }

        function rgbToHsl(r, g, b) {
            var rp = constrainRange(r / 255, 0, 1);
            var gp = constrainRange(g / 255, 0, 1);
            var bp = constrainRange(b / 255, 0, 1);
            var cmax = Math.max(rp, gp, bp);
            var cmin = Math.min(rp, gp, bp);
            var c = cmax - cmin;
            var h = 0;
            var s = 0;
            var l = (cmin + cmax) / 2;
            if (c !== 0) {
                s = l > 0.5 ? c / (2 - cmin - cmax) : c / (cmax + cmin);
                if (rp === cmax) {
                    h = (gp - bp) / c;
                }
                else if (gp === cmax) {
                    h = 2 + (bp - rp) / c;
                }
                else {
                    h = 4 + (rp - gp) / c;
                }
                h = h / 6 + (h < 0 ? 1 : 0);
            }
            return [h * 360, s * 100, l * 100];
        }
        function hslToRgb(h, s, l) {
            var _a, _b, _c, _d, _e, _f;
            var hp = ((h % 360) + 360) % 360;
            var sp = constrainRange(s / 100, 0, 1);
            var lp = constrainRange(l / 100, 0, 1);
            var c = (1 - Math.abs(2 * lp - 1)) * sp;
            var x = c * (1 - Math.abs(((hp / 60) % 2) - 1));
            var m = lp - c / 2;
            var rp, gp, bp;
            if (hp >= 0 && hp < 60) {
                _a = [c, x, 0], rp = _a[0], gp = _a[1], bp = _a[2];
            }
            else if (hp >= 60 && hp < 120) {
                _b = [x, c, 0], rp = _b[0], gp = _b[1], bp = _b[2];
            }
            else if (hp >= 120 && hp < 180) {
                _c = [0, c, x], rp = _c[0], gp = _c[1], bp = _c[2];
            }
            else if (hp >= 180 && hp < 240) {
                _d = [0, x, c], rp = _d[0], gp = _d[1], bp = _d[2];
            }
            else if (hp >= 240 && hp < 300) {
                _e = [x, 0, c], rp = _e[0], gp = _e[1], bp = _e[2];
            }
            else {
                _f = [c, 0, x], rp = _f[0], gp = _f[1], bp = _f[2];
            }
            return [(rp + m) * 255, (gp + m) * 255, (bp + m) * 255];
        }
        function rgbToHsv(r, g, b) {
            var rp = constrainRange(r / 255, 0, 1);
            var gp = constrainRange(g / 255, 0, 1);
            var bp = constrainRange(b / 255, 0, 1);
            var cmax = Math.max(rp, gp, bp);
            var cmin = Math.min(rp, gp, bp);
            var d = cmax - cmin;
            var h;
            if (d === 0) {
                h = 0;
            }
            else if (cmax === rp) {
                h = 60 * (((((gp - bp) / d) % 6) + 6) % 6);
            }
            else if (cmax === gp) {
                h = 60 * ((bp - rp) / d + 2);
            }
            else {
                h = 60 * ((rp - gp) / d + 4);
            }
            var s = cmax === 0 ? 0 : d / cmax;
            var v = cmax;
            return [h, s * 100, v * 100];
        }
        /**
         * @hidden
         */
        function hsvToRgb(h, s, v) {
            var _a, _b, _c, _d, _e, _f;
            var hp = loopRange(h, 360);
            var sp = constrainRange(s / 100, 0, 1);
            var vp = constrainRange(v / 100, 0, 1);
            var c = vp * sp;
            var x = c * (1 - Math.abs(((hp / 60) % 2) - 1));
            var m = vp - c;
            var rp, gp, bp;
            if (hp >= 0 && hp < 60) {
                _a = [c, x, 0], rp = _a[0], gp = _a[1], bp = _a[2];
            }
            else if (hp >= 60 && hp < 120) {
                _b = [x, c, 0], rp = _b[0], gp = _b[1], bp = _b[2];
            }
            else if (hp >= 120 && hp < 180) {
                _c = [0, c, x], rp = _c[0], gp = _c[1], bp = _c[2];
            }
            else if (hp >= 180 && hp < 240) {
                _d = [0, x, c], rp = _d[0], gp = _d[1], bp = _d[2];
            }
            else if (hp >= 240 && hp < 300) {
                _e = [x, 0, c], rp = _e[0], gp = _e[1], bp = _e[2];
            }
            else {
                _f = [c, 0, x], rp = _f[0], gp = _f[1], bp = _f[2];
            }
            return [(rp + m) * 255, (gp + m) * 255, (bp + m) * 255];
        }
        /**
         * @hidden
         */
        function removeAlphaComponent(comps) {
            return [comps[0], comps[1], comps[2]];
        }
        /**
         * @hidden
         */
        function appendAlphaComponent(comps, alpha) {
            return [comps[0], comps[1], comps[2], alpha];
        }
        var MODE_CONVERTER_MAP = {
            hsl: {
                hsl: function (h, s, l) { return [h, s, l]; },
                hsv: function (h, s, l) {
                    var _a = hslToRgb(h, s, l), r = _a[0], g = _a[1], b = _a[2];
                    return rgbToHsv(r, g, b);
                },
                rgb: hslToRgb,
            },
            hsv: {
                hsl: function (h, s, v) {
                    var _a = hsvToRgb(h, s, v), r = _a[0], g = _a[1], b = _a[2];
                    return rgbToHsl(r, g, b);
                },
                hsv: function (h, s, v) { return [h, s, v]; },
                rgb: hsvToRgb,
            },
            rgb: {
                hsl: rgbToHsl,
                hsv: rgbToHsv,
                rgb: function (r, g, b) { return [r, g, b]; },
            },
        };
        /**
         * @hidden
         */
        function convertColorMode(components, fromMode, toMode) {
            var _a;
            return (_a = MODE_CONVERTER_MAP[fromMode])[toMode].apply(_a, components);
        }

        var CONSTRAINT_MAP = {
            hsl: function (comps) {
                var _a;
                return [
                    loopRange(comps[0], 360),
                    constrainRange(comps[1], 0, 100),
                    constrainRange(comps[2], 0, 100),
                    constrainRange((_a = comps[3]) !== null && _a !== void 0 ? _a : 1, 0, 1),
                ];
            },
            hsv: function (comps) {
                var _a;
                return [
                    loopRange(comps[0], 360),
                    constrainRange(comps[1], 0, 100),
                    constrainRange(comps[2], 0, 100),
                    constrainRange((_a = comps[3]) !== null && _a !== void 0 ? _a : 1, 0, 1),
                ];
            },
            rgb: function (comps) {
                var _a;
                return [
                    constrainRange(comps[0], 0, 255),
                    constrainRange(comps[1], 0, 255),
                    constrainRange(comps[2], 0, 255),
                    constrainRange((_a = comps[3]) !== null && _a !== void 0 ? _a : 1, 0, 1),
                ];
            },
        };
        function isRgbColorComponent(obj, key) {
            if (typeof obj !== 'object' || isEmpty(obj)) {
                return false;
            }
            return key in obj && typeof obj[key] === 'number';
        }
        /**
         * @hidden
         */
        var Color = /** @class */ (function () {
            function Color(comps, mode) {
                this.mode_ = mode;
                this.comps_ = CONSTRAINT_MAP[mode](comps);
            }
            Color.black = function () {
                return new Color([0, 0, 0], 'rgb');
            };
            Color.fromObject = function (obj) {
                var comps = 'a' in obj ? [obj.r, obj.g, obj.b, obj.a] : [obj.r, obj.g, obj.b];
                return new Color(comps, 'rgb');
            };
            Color.toRgbaObject = function (color) {
                return color.toRgbaObject();
            };
            Color.isRgbColorObject = function (obj) {
                return (isRgbColorComponent(obj, 'r') &&
                    isRgbColorComponent(obj, 'g') &&
                    isRgbColorComponent(obj, 'b'));
            };
            Color.isRgbaColorObject = function (obj) {
                return this.isRgbColorObject(obj) && isRgbColorComponent(obj, 'a');
            };
            Color.isColorObject = function (obj) {
                return this.isRgbColorObject(obj);
            };
            Color.equals = function (v1, v2) {
                if (v1.mode_ !== v2.mode_) {
                    return false;
                }
                var comps1 = v1.comps_;
                var comps2 = v2.comps_;
                for (var i = 0; i < comps1.length; i++) {
                    if (comps1[i] !== comps2[i]) {
                        return false;
                    }
                }
                return true;
            };
            Object.defineProperty(Color.prototype, "mode", {
                get: function () {
                    return this.mode_;
                },
                enumerable: false,
                configurable: true
            });
            Color.prototype.getComponents = function (opt_mode) {
                return appendAlphaComponent(convertColorMode(removeAlphaComponent(this.comps_), this.mode_, opt_mode || this.mode_), this.comps_[3]);
            };
            Color.prototype.toRgbaObject = function () {
                var rgbComps = this.getComponents('rgb');
                return {
                    r: rgbComps[0],
                    g: rgbComps[1],
                    b: rgbComps[2],
                    a: rgbComps[3],
                };
            };
            return Color;
        }());

        function parseCssNumberOrPercentage(text, maxValue) {
            var m = text.match(/^(.+)%$/);
            if (!m) {
                return Math.min(parseFloat(text), maxValue);
            }
            return Math.min(parseFloat(m[1]) * 0.01 * maxValue, maxValue);
        }
        var ANGLE_TO_DEG_MAP = {
            deg: function (angle) { return angle; },
            grad: function (angle) { return (angle * 360) / 400; },
            rad: function (angle) { return (angle * 360) / (2 * Math.PI); },
            turn: function (angle) { return angle * 360; },
        };
        function parseCssNumberOrAngle(text) {
            var m = text.match(/^([0-9.]+?)(deg|grad|rad|turn)$/);
            if (!m) {
                return parseFloat(text);
            }
            var angle = parseFloat(m[1]);
            var unit = m[2];
            return ANGLE_TO_DEG_MAP[unit](angle);
        }
        var NOTATION_TO_PARSER_MAP = {
            'func.rgb': function (text) {
                var m = text.match(/^rgb\(\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
                if (!m) {
                    return null;
                }
                var comps = [
                    parseCssNumberOrPercentage(m[1], 255),
                    parseCssNumberOrPercentage(m[2], 255),
                    parseCssNumberOrPercentage(m[3], 255),
                ];
                if (isNaN(comps[0]) || isNaN(comps[1]) || isNaN(comps[2])) {
                    return null;
                }
                return new Color(comps, 'rgb');
            },
            'func.rgba': function (text) {
                var m = text.match(/^rgba\(\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
                if (!m) {
                    return null;
                }
                var comps = [
                    parseCssNumberOrPercentage(m[1], 255),
                    parseCssNumberOrPercentage(m[2], 255),
                    parseCssNumberOrPercentage(m[3], 255),
                    parseCssNumberOrPercentage(m[4], 1),
                ];
                if (isNaN(comps[0]) ||
                    isNaN(comps[1]) ||
                    isNaN(comps[2]) ||
                    isNaN(comps[3])) {
                    return null;
                }
                return new Color(comps, 'rgb');
            },
            'func.hsl': function (text) {
                var m = text.match(/^hsl\(\s*([0-9A-Fa-f.]+(?:deg|grad|rad|turn)?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
                if (!m) {
                    return null;
                }
                var comps = [
                    parseCssNumberOrAngle(m[1]),
                    parseCssNumberOrPercentage(m[2], 100),
                    parseCssNumberOrPercentage(m[3], 100),
                ];
                if (isNaN(comps[0]) || isNaN(comps[1]) || isNaN(comps[2])) {
                    return null;
                }
                return new Color(comps, 'hsl');
            },
            'func.hsla': function (text) {
                var m = text.match(/^hsla\(\s*([0-9A-Fa-f.]+(?:deg|grad|rad|turn)?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);
                if (!m) {
                    return null;
                }
                var comps = [
                    parseCssNumberOrAngle(m[1]),
                    parseCssNumberOrPercentage(m[2], 100),
                    parseCssNumberOrPercentage(m[3], 100),
                    parseCssNumberOrPercentage(m[4], 1),
                ];
                if (isNaN(comps[0]) ||
                    isNaN(comps[1]) ||
                    isNaN(comps[2]) ||
                    isNaN(comps[3])) {
                    return null;
                }
                return new Color(comps, 'hsl');
            },
            'hex.rgb': function (text) {
                var mRrggbb = text.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);
                if (mRrggbb) {
                    return new Color([
                        parseInt(mRrggbb[1] + mRrggbb[1], 16),
                        parseInt(mRrggbb[2] + mRrggbb[2], 16),
                        parseInt(mRrggbb[3] + mRrggbb[3], 16),
                    ], 'rgb');
                }
                var mRgb = text.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
                if (mRgb) {
                    return new Color([parseInt(mRgb[1], 16), parseInt(mRgb[2], 16), parseInt(mRgb[3], 16)], 'rgb');
                }
                return null;
            },
            'hex.rgba': function (text) {
                var mRrggbb = text.match(/^#?([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);
                if (mRrggbb) {
                    return new Color([
                        parseInt(mRrggbb[1] + mRrggbb[1], 16),
                        parseInt(mRrggbb[2] + mRrggbb[2], 16),
                        parseInt(mRrggbb[3] + mRrggbb[3], 16),
                        mapRange(parseInt(mRrggbb[4] + mRrggbb[4], 16), 0, 255, 0, 1),
                    ], 'rgb');
                }
                var mRgb = text.match(/^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
                if (mRgb) {
                    return new Color([
                        parseInt(mRgb[1], 16),
                        parseInt(mRgb[2], 16),
                        parseInt(mRgb[3], 16),
                        mapRange(parseInt(mRgb[4], 16), 0, 255, 0, 1),
                    ], 'rgb');
                }
                return null;
            },
        };
        /**
         * @hidden
         */
        function getColorNotation(text) {
            var notations = Object.keys(NOTATION_TO_PARSER_MAP);
            return notations.reduce(function (result, notation) {
                if (result) {
                    return result;
                }
                var subparser = NOTATION_TO_PARSER_MAP[notation];
                return subparser(text) ? notation : null;
            }, null);
        }
        /**
         * @hidden
         */
        var CompositeColorParser = function (text) {
            var notation = getColorNotation(text);
            return notation ? NOTATION_TO_PARSER_MAP[notation](text) : null;
        };
        function hasAlphaComponent(notation) {
            return (notation === 'func.hsla' ||
                notation === 'func.rgba' ||
                notation === 'hex.rgba');
        }
        /**
         * @hidden
         */
        function colorFromString(value) {
            if (typeof value === 'string') {
                var cv = CompositeColorParser(value);
                if (cv) {
                    return cv;
                }
            }
            return Color.black();
        }
        function zerofill(comp) {
            var hex = constrainRange(Math.floor(comp), 0, 255).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }
        /**
         * @hidden
         */
        function colorToHexRgbString(value) {
            var hexes = removeAlphaComponent(value.getComponents('rgb'))
                .map(zerofill)
                .join('');
            return "#" + hexes;
        }
        /**
         * @hidden
         */
        function colorToHexRgbaString(value) {
            var rgbaComps = value.getComponents('rgb');
            var hexes = [rgbaComps[0], rgbaComps[1], rgbaComps[2], rgbaComps[3] * 255]
                .map(zerofill)
                .join('');
            return "#" + hexes;
        }
        /**
         * @hidden
         */
        function colorToFunctionalRgbString(value) {
            var formatter = createNumberFormatter(0);
            var comps = removeAlphaComponent(value.getComponents('rgb')).map(function (comp) {
                return formatter(comp);
            });
            return "rgb(" + comps.join(', ') + ")";
        }
        /**
         * @hidden
         */
        function colorToFunctionalRgbaString(value) {
            var aFormatter = createNumberFormatter(2);
            var rgbFormatter = createNumberFormatter(0);
            var comps = value.getComponents('rgb').map(function (comp, index) {
                var formatter = index === 3 ? aFormatter : rgbFormatter;
                return formatter(comp);
            });
            return "rgba(" + comps.join(', ') + ")";
        }
        /**
         * @hidden
         */
        function colorToFunctionalHslString(value) {
            var formatters = [
                createNumberFormatter(0),
                formatPercentage,
                formatPercentage,
            ];
            var comps = removeAlphaComponent(value.getComponents('hsl')).map(function (comp, index) { return formatters[index](comp); });
            return "hsl(" + comps.join(', ') + ")";
        }
        /**
         * @hidden
         */
        function colorToFunctionalHslaString(value) {
            var formatters = [
                createNumberFormatter(0),
                formatPercentage,
                formatPercentage,
                createNumberFormatter(2),
            ];
            var comps = value
                .getComponents('hsl')
                .map(function (comp, index) { return formatters[index](comp); });
            return "hsla(" + comps.join(', ') + ")";
        }
        var NOTATION_TO_STRINGIFIER_MAP = {
            'func.hsl': colorToFunctionalHslString,
            'func.hsla': colorToFunctionalHslaString,
            'func.rgb': colorToFunctionalRgbString,
            'func.rgba': colorToFunctionalRgbaString,
            'hex.rgb': colorToHexRgbString,
            'hex.rgba': colorToHexRgbaString,
        };
        function getColorStringifier(notation) {
            return NOTATION_TO_STRINGIFIER_MAP[notation];
        }

        var className$a = ClassName('csw');
        /**
         * @hidden
         */
        var ColorSwatchView = /** @class */ (function () {
            function ColorSwatchView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.element = doc.createElement('div');
                this.element.classList.add(className$a());
                var swatchElem = doc.createElement('div');
                swatchElem.classList.add(className$a('sw'));
                this.element.appendChild(swatchElem);
                this.swatchElem_ = swatchElem;
                var buttonElem = doc.createElement('button');
                buttonElem.classList.add(className$a('b'));
                this.element.appendChild(buttonElem);
                this.buttonElement = buttonElem;
                var pickerElem = doc.createElement('div');
                pickerElem.classList.add(className$a('p'));
                this.pickerView_ = config.pickerView;
                pickerElem.appendChild(this.pickerView_.element);
                this.element.appendChild(pickerElem);
                this.update();
            }
            ColorSwatchView.prototype.update = function () {
                var value = this.value.rawValue;
                this.swatchElem_.style.backgroundColor = colorToHexRgbaString(value);
            };
            ColorSwatchView.prototype.onValueChange_ = function () {
                this.update();
            };
            return ColorSwatchView;
        }());

        /**
         * @hidden
         */
        var Foldable = /** @class */ (function () {
            function Foldable() {
                this.emitter = new Emitter();
                this.expanded_ = false;
            }
            Object.defineProperty(Foldable.prototype, "expanded", {
                get: function () {
                    return this.expanded_;
                },
                set: function (expanded) {
                    var changed = this.expanded_ !== expanded;
                    if (changed) {
                        this.expanded_ = expanded;
                        this.emitter.emit('change', {
                            sender: this,
                        });
                    }
                },
                enumerable: false,
                configurable: true
            });
            return Foldable;
        }());

        /**
         * @hidden
         */
        function connect(_a) {
            var primary = _a.primary, secondary = _a.secondary, forward = _a.forward, backward = _a.backward;
            primary.emitter.on('change', function () {
                secondary.rawValue = forward(primary, secondary);
            });
            secondary.emitter.on('change', function () {
                primary.rawValue = backward(primary, secondary);
            });
            secondary.rawValue = forward(primary, secondary);
        }

        /**
         * @hidden
         */
        function getStepForKey(baseStep, keys) {
            var step = baseStep * (keys.altKey ? 0.1 : 1) * (keys.shiftKey ? 10 : 1);
            if (keys.upKey) {
                return +step;
            }
            else if (keys.downKey) {
                return -step;
            }
            return 0;
        }
        /**
         * @hidden
         */
        function getVerticalStepKeys(ev) {
            return {
                altKey: ev.altKey,
                downKey: ev.keyCode === 40,
                shiftKey: ev.shiftKey,
                upKey: ev.keyCode === 38,
            };
        }
        /**
         * @hidden
         */
        function getHorizontalStepKeys(ev) {
            return {
                altKey: ev.altKey,
                downKey: ev.keyCode === 37,
                shiftKey: ev.shiftKey,
                upKey: ev.keyCode === 39,
            };
        }
        /**
         * @hidden
         */
        function isVerticalArrowKey(keyCode) {
            return keyCode === 38 || keyCode === 40;
        }
        /**
         * @hidden
         */
        function isArrowKey(keyCode) {
            return isVerticalArrowKey(keyCode) || keyCode === 37 || keyCode === 39;
        }

        /**
         * @hidden
         */
        var NumberTextController = /** @class */ (function (_super) {
            __extends(NumberTextController, _super);
            function NumberTextController(doc, config) {
                var _this = _super.call(this, doc, config) || this;
                _this.onInputKeyDown_ = _this.onInputKeyDown_.bind(_this);
                _this.baseStep_ = config.baseStep;
                _this.view.inputElement.addEventListener('keydown', _this.onInputKeyDown_);
                return _this;
            }
            NumberTextController.prototype.onInputKeyDown_ = function (e) {
                var step = getStepForKey(this.baseStep_, getVerticalStepKeys(e));
                if (step !== 0) {
                    this.value.rawValue += step;
                    this.view.update();
                }
            };
            return NumberTextController;
        }(TextController));

        var className$b = ClassName('clp');
        /**
         * @hidden
         */
        var ColorPickerView = /** @class */ (function () {
            function ColorPickerView(doc, config) {
                this.alphaViews_ = null;
                this.onFoldableChange_ = this.onFoldableChange_.bind(this);
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.pickedColor = config.pickedColor;
                this.pickedColor.value.emitter.on('change', this.onValueChange_);
                this.foldable = config.foldable;
                this.foldable.emitter.on('change', this.onFoldableChange_);
                this.element = doc.createElement('div');
                this.element.classList.add(className$b());
                var hsvElem = doc.createElement('div');
                hsvElem.classList.add(className$b('hsv'));
                var svElem = doc.createElement('div');
                svElem.classList.add(className$b('sv'));
                this.svPaletteView_ = config.svPaletteView;
                svElem.appendChild(this.svPaletteView_.element);
                hsvElem.appendChild(svElem);
                var hElem = doc.createElement('div');
                hElem.classList.add(className$b('h'));
                this.hPaletteView_ = config.hPaletteView;
                hElem.appendChild(this.hPaletteView_.element);
                hsvElem.appendChild(hElem);
                this.element.appendChild(hsvElem);
                var rgbElem = doc.createElement('div');
                rgbElem.classList.add(className$b('rgb'));
                this.compTextsView_ = config.componentTextsView;
                rgbElem.appendChild(this.compTextsView_.element);
                this.element.appendChild(rgbElem);
                if (config.alphaViews) {
                    this.alphaViews_ = {
                        palette: config.alphaViews.palette,
                        text: config.alphaViews.text,
                    };
                    var aElem = doc.createElement('div');
                    aElem.classList.add(className$b('a'));
                    var apElem = doc.createElement('div');
                    apElem.classList.add(className$b('ap'));
                    apElem.appendChild(this.alphaViews_.palette.element);
                    aElem.appendChild(apElem);
                    var atElem = doc.createElement('div');
                    atElem.classList.add(className$b('at'));
                    atElem.appendChild(this.alphaViews_.text.element);
                    aElem.appendChild(atElem);
                    this.element.appendChild(aElem);
                }
                this.update();
            }
            Object.defineProperty(ColorPickerView.prototype, "allFocusableElements", {
                get: function () {
                    var elems = __spreadArrays([
                        this.svPaletteView_.element,
                        this.hPaletteView_.element
                    ], this.compTextsView_.inputElements);
                    if (this.alphaViews_) {
                        elems.push(this.alphaViews_.palette.element, this.alphaViews_.text.inputElement);
                    }
                    return forceCast(elems);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ColorPickerView.prototype, "value", {
                get: function () {
                    return this.pickedColor.value;
                },
                enumerable: false,
                configurable: true
            });
            ColorPickerView.prototype.update = function () {
                if (this.foldable.expanded) {
                    this.element.classList.add(className$b(undefined, 'expanded'));
                }
                else {
                    this.element.classList.remove(className$b(undefined, 'expanded'));
                }
            };
            ColorPickerView.prototype.onValueChange_ = function () {
                this.update();
            };
            ColorPickerView.prototype.onFoldableChange_ = function () {
                this.update();
            };
            return ColorPickerView;
        }());

        function computeOffset(ev, elem) {
            // NOTE: OffsetX/Y should be computed from page and window properties to capture mouse events
            var win = elem.ownerDocument.defaultView;
            var rect = elem.getBoundingClientRect();
            return [
                ev.pageX - (((win && win.scrollX) || 0) + rect.left),
                ev.pageY - (((win && win.scrollY) || 0) + rect.top),
            ];
        }
        /**
         * A utility class to handle both mouse and touch events.
         * @hidden
         */
        var PointerHandler = /** @class */ (function () {
            function PointerHandler(doc, element) {
                this.onDocumentMouseMove_ = this.onDocumentMouseMove_.bind(this);
                this.onDocumentMouseUp_ = this.onDocumentMouseUp_.bind(this);
                this.onMouseDown_ = this.onMouseDown_.bind(this);
                this.onTouchMove_ = this.onTouchMove_.bind(this);
                this.onTouchStart_ = this.onTouchStart_.bind(this);
                this.document = doc;
                this.element = element;
                this.emitter = new Emitter();
                this.pressed_ = false;
                if (supportsTouch(this.document)) {
                    element.addEventListener('touchstart', this.onTouchStart_);
                    element.addEventListener('touchmove', this.onTouchMove_);
                }
                else {
                    element.addEventListener('mousedown', this.onMouseDown_);
                    this.document.addEventListener('mousemove', this.onDocumentMouseMove_);
                    this.document.addEventListener('mouseup', this.onDocumentMouseUp_);
                }
            }
            PointerHandler.prototype.computePosition_ = function (offsetX, offsetY) {
                var rect = this.element.getBoundingClientRect();
                return {
                    px: offsetX / rect.width,
                    py: offsetY / rect.height,
                };
            };
            PointerHandler.prototype.onMouseDown_ = function (e) {
                var _a;
                // Prevent native text selection
                e.preventDefault();
                (_a = e.currentTarget) === null || _a === void 0 ? void 0 : _a.focus();
                this.pressed_ = true;
                this.emitter.emit('down', {
                    data: this.computePosition_.apply(this, computeOffset(e, this.element)),
                    sender: this,
                });
            };
            PointerHandler.prototype.onDocumentMouseMove_ = function (e) {
                if (!this.pressed_) {
                    return;
                }
                this.emitter.emit('move', {
                    data: this.computePosition_.apply(this, computeOffset(e, this.element)),
                    sender: this,
                });
            };
            PointerHandler.prototype.onDocumentMouseUp_ = function (e) {
                if (!this.pressed_) {
                    return;
                }
                this.pressed_ = false;
                this.emitter.emit('up', {
                    data: this.computePosition_.apply(this, computeOffset(e, this.element)),
                    sender: this,
                });
            };
            PointerHandler.prototype.onTouchStart_ = function (e) {
                // Prevent native page scroll
                e.preventDefault();
                var touch = e.targetTouches[0];
                var rect = this.element.getBoundingClientRect();
                this.emitter.emit('down', {
                    data: this.computePosition_(touch.clientX - rect.left, touch.clientY - rect.top),
                    sender: this,
                });
            };
            PointerHandler.prototype.onTouchMove_ = function (e) {
                var touch = e.targetTouches[0];
                var rect = this.element.getBoundingClientRect();
                this.emitter.emit('move', {
                    data: this.computePosition_(touch.clientX - rect.left, touch.clientY - rect.top),
                    sender: this,
                });
            };
            return PointerHandler;
        }());

        /**
         * @hidden
         */
        function getBaseStepForColor(forAlpha) {
            return forAlpha ? 0.1 : 1;
        }

        var className$c = ClassName('apl');
        /**
         * @hidden
         */
        var APaletteView = /** @class */ (function () {
            function APaletteView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.value = config.value;
                this.value.emitter.on('change', this.onValueChange_);
                this.element = doc.createElement('div');
                this.element.classList.add(className$c());
                this.element.tabIndex = 0;
                var barElem = doc.createElement('div');
                barElem.classList.add(className$c('b'));
                this.element.appendChild(barElem);
                var colorElem = doc.createElement('div');
                colorElem.classList.add(className$c('c'));
                barElem.appendChild(colorElem);
                this.colorElem_ = colorElem;
                var markerElem = doc.createElement('div');
                markerElem.classList.add(className$c('m'));
                this.element.appendChild(markerElem);
                this.markerElem_ = markerElem;
                var previewElem = doc.createElement('div');
                previewElem.classList.add(className$c('p'));
                this.markerElem_.appendChild(previewElem);
                this.previewElem_ = previewElem;
                this.update();
            }
            APaletteView.prototype.update = function () {
                var c = this.value.rawValue;
                var rgbaComps = c.getComponents('rgb');
                var leftColor = new Color([rgbaComps[0], rgbaComps[1], rgbaComps[2], 0], 'rgb');
                var rightColor = new Color([rgbaComps[0], rgbaComps[1], rgbaComps[2], 255], 'rgb');
                var gradientComps = [
                    'to right',
                    colorToFunctionalRgbaString(leftColor),
                    colorToFunctionalRgbaString(rightColor),
                ];
                this.colorElem_.style.background = "linear-gradient(" + gradientComps.join(',') + ")";
                this.previewElem_.style.backgroundColor = colorToFunctionalRgbaString(c);
                var left = mapRange(rgbaComps[3], 0, 1, 0, 100);
                this.markerElem_.style.left = left + "%";
            };
            APaletteView.prototype.onValueChange_ = function () {
                this.update();
            };
            return APaletteView;
        }());

        /**
         * @hidden
         */
        var APaletteController = /** @class */ (function () {
            function APaletteController(doc, config) {
                this.onKeyDown_ = this.onKeyDown_.bind(this);
                this.onPointerDown_ = this.onPointerDown_.bind(this);
                this.onPointerMove_ = this.onPointerMove_.bind(this);
                this.onPointerUp_ = this.onPointerUp_.bind(this);
                this.value = config.value;
                this.view = new APaletteView(doc, {
                    value: this.value,
                });
                this.ptHandler_ = new PointerHandler(doc, this.view.element);
                this.ptHandler_.emitter.on('down', this.onPointerDown_);
                this.ptHandler_.emitter.on('move', this.onPointerMove_);
                this.ptHandler_.emitter.on('up', this.onPointerUp_);
                this.view.element.addEventListener('keydown', this.onKeyDown_);
            }
            APaletteController.prototype.handlePointerEvent_ = function (d) {
                var alpha = d.px;
                var c = this.value.rawValue;
                var _a = c.getComponents('hsv'), h = _a[0], s = _a[1], v = _a[2];
                this.value.rawValue = new Color([h, s, v, alpha], 'hsv');
                this.view.update();
            };
            APaletteController.prototype.onPointerDown_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            APaletteController.prototype.onPointerMove_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            APaletteController.prototype.onPointerUp_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            APaletteController.prototype.onKeyDown_ = function (ev) {
                var step = getStepForKey(getBaseStepForColor(true), getHorizontalStepKeys(ev));
                var c = this.value.rawValue;
                var _a = c.getComponents('hsv'), h = _a[0], s = _a[1], v = _a[2], a = _a[3];
                this.value.rawValue = new Color([h, s, v, a + step], 'hsv');
            };
            return APaletteController;
        }());

        var className$d = ClassName('cctxts');
        var FORMATTER = createNumberFormatter(0);
        function createModeSelectElement(doc) {
            var selectElem = doc.createElement('select');
            var items = [
                { text: 'RGB', value: 'rgb' },
                { text: 'HSL', value: 'hsl' },
                { text: 'HSV', value: 'hsv' },
            ];
            selectElem.appendChild(items.reduce(function (frag, item) {
                var optElem = doc.createElement('option');
                optElem.textContent = item.text;
                optElem.value = item.value;
                frag.appendChild(optElem);
                return frag;
            }, doc.createDocumentFragment()));
            return selectElem;
        }
        /**
         * @hidden
         */
        var ColorComponentTextsView = /** @class */ (function () {
            function ColorComponentTextsView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.element = doc.createElement('div');
                this.element.classList.add(className$d());
                var modeElem = doc.createElement('div');
                modeElem.classList.add(className$d('m'));
                this.modeElem_ = createModeSelectElement(doc);
                this.modeElem_.classList.add(className$d('ms'));
                modeElem.appendChild(this.modeSelectElement);
                var modeMarkerElem = doc.createElement('div');
                modeMarkerElem.classList.add(className$d('mm'));
                modeElem.appendChild(modeMarkerElem);
                this.element.appendChild(modeElem);
                var wrapperElem = doc.createElement('div');
                wrapperElem.classList.add(className$d('w'));
                this.element.appendChild(wrapperElem);
                var inputElems = [0, 1, 2].map(function () {
                    var inputElem = doc.createElement('input');
                    inputElem.classList.add(className$d('i'));
                    inputElem.type = 'text';
                    return inputElem;
                });
                inputElems.forEach(function (elem) {
                    wrapperElem.appendChild(elem);
                });
                this.inputElems_ = [inputElems[0], inputElems[1], inputElems[2]];
                this.pickedColor = config.pickedColor;
                this.pickedColor.emitter.on('change', this.onValueChange_);
                this.update();
            }
            Object.defineProperty(ColorComponentTextsView.prototype, "modeSelectElement", {
                get: function () {
                    return this.modeElem_;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ColorComponentTextsView.prototype, "inputElements", {
                get: function () {
                    return this.inputElems_;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ColorComponentTextsView.prototype, "value", {
                get: function () {
                    return this.pickedColor.value;
                },
                enumerable: false,
                configurable: true
            });
            ColorComponentTextsView.prototype.update = function () {
                var _this = this;
                this.modeElem_.value = this.pickedColor.mode;
                var comps = this.pickedColor.value.rawValue.getComponents(this.pickedColor.mode);
                comps.forEach(function (comp, index) {
                    var inputElem = _this.inputElems_[index];
                    if (!inputElem) {
                        return;
                    }
                    inputElem.value = FORMATTER(comp);
                });
            };
            ColorComponentTextsView.prototype.onValueChange_ = function () {
                this.update();
            };
            return ColorComponentTextsView;
        }());

        /**
         * @hidden
         */
        var ColorComponentTextsController = /** @class */ (function () {
            function ColorComponentTextsController(doc, config) {
                var _this = this;
                this.onModeSelectChange_ = this.onModeSelectChange_.bind(this);
                this.onInputChange_ = this.onInputChange_.bind(this);
                this.onInputKeyDown_ = this.onInputKeyDown_.bind(this);
                this.parser_ = config.parser;
                this.pickedColor = config.pickedColor;
                this.view = new ColorComponentTextsView(doc, {
                    pickedColor: this.pickedColor,
                });
                this.view.inputElements.forEach(function (inputElem) {
                    inputElem.addEventListener('change', _this.onInputChange_);
                    inputElem.addEventListener('keydown', _this.onInputKeyDown_);
                });
                this.view.modeSelectElement.addEventListener('change', this.onModeSelectChange_);
            }
            Object.defineProperty(ColorComponentTextsController.prototype, "value", {
                get: function () {
                    return this.pickedColor.value;
                },
                enumerable: false,
                configurable: true
            });
            ColorComponentTextsController.prototype.findIndexOfInputElem_ = function (inputElem) {
                var inputElems = this.view.inputElements;
                for (var i = 0; i < inputElems.length; i++) {
                    if (inputElems[i] === inputElem) {
                        return i;
                    }
                }
                return null;
            };
            ColorComponentTextsController.prototype.updateComponent_ = function (index, newValue) {
                var mode = this.pickedColor.mode;
                var comps = this.value.rawValue.getComponents(mode);
                var newComps = comps.map(function (comp, i) {
                    return i === index ? newValue : comp;
                });
                this.value.rawValue = new Color(newComps, mode);
                this.view.update();
            };
            ColorComponentTextsController.prototype.onInputChange_ = function (e) {
                var inputElem = forceCast(e.currentTarget);
                var parsedValue = this.parser_(inputElem.value);
                if (isEmpty(parsedValue)) {
                    return;
                }
                var compIndex = this.findIndexOfInputElem_(inputElem);
                if (isEmpty(compIndex)) {
                    return;
                }
                this.updateComponent_(compIndex, parsedValue);
            };
            ColorComponentTextsController.prototype.onInputKeyDown_ = function (e) {
                var compIndex = this.findIndexOfInputElem_(e.currentTarget);
                var step = getStepForKey(getBaseStepForColor(compIndex === 3), getVerticalStepKeys(e));
                if (step === 0) {
                    return;
                }
                var inputElem = forceCast(e.currentTarget);
                var parsedValue = this.parser_(inputElem.value);
                if (isEmpty(parsedValue)) {
                    return;
                }
                if (isEmpty(compIndex)) {
                    return;
                }
                this.updateComponent_(compIndex, parsedValue + step);
            };
            ColorComponentTextsController.prototype.onModeSelectChange_ = function (ev) {
                var selectElem = ev.currentTarget;
                this.pickedColor.mode = selectElem.value;
            };
            return ColorComponentTextsController;
        }());

        var className$e = ClassName('hpl');
        /**
         * @hidden
         */
        var HPaletteView = /** @class */ (function () {
            function HPaletteView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.value = config.value;
                this.value.emitter.on('change', this.onValueChange_);
                this.element = doc.createElement('div');
                this.element.classList.add(className$e());
                this.element.tabIndex = 0;
                var colorElem = doc.createElement('div');
                colorElem.classList.add(className$e('c'));
                this.element.appendChild(colorElem);
                var markerElem = doc.createElement('div');
                markerElem.classList.add(className$e('m'));
                this.element.appendChild(markerElem);
                this.markerElem_ = markerElem;
                this.update();
            }
            HPaletteView.prototype.update = function () {
                var c = this.value.rawValue;
                var h = c.getComponents('hsv')[0];
                this.markerElem_.style.backgroundColor = colorToFunctionalRgbString(new Color([h, 100, 100], 'hsv'));
                var left = mapRange(h, 0, 360, 0, 100);
                this.markerElem_.style.left = left + "%";
            };
            HPaletteView.prototype.onValueChange_ = function () {
                this.update();
            };
            return HPaletteView;
        }());

        /**
         * @hidden
         */
        var HPaletteController = /** @class */ (function () {
            function HPaletteController(doc, config) {
                this.onKeyDown_ = this.onKeyDown_.bind(this);
                this.onPointerDown_ = this.onPointerDown_.bind(this);
                this.onPointerMove_ = this.onPointerMove_.bind(this);
                this.onPointerUp_ = this.onPointerUp_.bind(this);
                this.value = config.value;
                this.view = new HPaletteView(doc, {
                    value: this.value,
                });
                this.ptHandler_ = new PointerHandler(doc, this.view.element);
                this.ptHandler_.emitter.on('down', this.onPointerDown_);
                this.ptHandler_.emitter.on('move', this.onPointerMove_);
                this.ptHandler_.emitter.on('up', this.onPointerUp_);
                this.view.element.addEventListener('keydown', this.onKeyDown_);
            }
            HPaletteController.prototype.handlePointerEvent_ = function (d) {
                var hue = mapRange(d.px, 0, 1, 0, 360);
                var c = this.value.rawValue;
                var _a = c.getComponents('hsv'), s = _a[1], v = _a[2], a = _a[3];
                this.value.rawValue = new Color([hue, s, v, a], 'hsv');
                this.view.update();
            };
            HPaletteController.prototype.onPointerDown_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            HPaletteController.prototype.onPointerMove_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            HPaletteController.prototype.onPointerUp_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            HPaletteController.prototype.onKeyDown_ = function (ev) {
                var step = getStepForKey(getBaseStepForColor(false), getHorizontalStepKeys(ev));
                var c = this.value.rawValue;
                var _a = c.getComponents('hsv'), h = _a[0], s = _a[1], v = _a[2], a = _a[3];
                this.value.rawValue = new Color([h + step, s, v, a], 'hsv');
            };
            return HPaletteController;
        }());

        var className$f = ClassName('svp');
        var CANVAS_RESOL = 64;
        /**
         * @hidden
         */
        var SvPaletteView = /** @class */ (function () {
            function SvPaletteView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.value = config.value;
                this.value.emitter.on('change', this.onValueChange_);
                this.element = doc.createElement('div');
                this.element.classList.add(className$f());
                this.element.tabIndex = 0;
                var canvasElem = doc.createElement('canvas');
                canvasElem.height = CANVAS_RESOL;
                canvasElem.width = CANVAS_RESOL;
                canvasElem.classList.add(className$f('c'));
                this.element.appendChild(canvasElem);
                this.canvasElement = canvasElem;
                var markerElem = doc.createElement('div');
                markerElem.classList.add(className$f('m'));
                this.element.appendChild(markerElem);
                this.markerElem_ = markerElem;
                this.update();
            }
            SvPaletteView.prototype.update = function () {
                var ctx = getCanvasContext(this.canvasElement);
                if (!ctx) {
                    return;
                }
                var c = this.value.rawValue;
                var hsvComps = c.getComponents('hsv');
                var width = this.canvasElement.width;
                var height = this.canvasElement.height;
                var imgData = ctx.getImageData(0, 0, width, height);
                var data = imgData.data;
                for (var iy = 0; iy < height; iy++) {
                    for (var ix = 0; ix < width; ix++) {
                        var s = mapRange(ix, 0, width, 0, 100);
                        var v = mapRange(iy, 0, height, 100, 0);
                        var rgbComps = hsvToRgb(hsvComps[0], s, v);
                        var i = (iy * width + ix) * 4;
                        data[i] = rgbComps[0];
                        data[i + 1] = rgbComps[1];
                        data[i + 2] = rgbComps[2];
                        data[i + 3] = 255;
                    }
                }
                ctx.putImageData(imgData, 0, 0);
                var left = mapRange(hsvComps[1], 0, 100, 0, 100);
                this.markerElem_.style.left = left + "%";
                var top = mapRange(hsvComps[2], 0, 100, 100, 0);
                this.markerElem_.style.top = top + "%";
            };
            SvPaletteView.prototype.onValueChange_ = function () {
                this.update();
            };
            return SvPaletteView;
        }());

        /**
         * @hidden
         */
        var SvPaletteController = /** @class */ (function () {
            function SvPaletteController(doc, config) {
                this.onKeyDown_ = this.onKeyDown_.bind(this);
                this.onPointerDown_ = this.onPointerDown_.bind(this);
                this.onPointerMove_ = this.onPointerMove_.bind(this);
                this.onPointerUp_ = this.onPointerUp_.bind(this);
                this.value = config.value;
                this.view = new SvPaletteView(doc, {
                    value: this.value,
                });
                this.ptHandler_ = new PointerHandler(doc, this.view.element);
                this.ptHandler_.emitter.on('down', this.onPointerDown_);
                this.ptHandler_.emitter.on('move', this.onPointerMove_);
                this.ptHandler_.emitter.on('up', this.onPointerUp_);
                this.view.element.addEventListener('keydown', this.onKeyDown_);
            }
            SvPaletteController.prototype.handlePointerEvent_ = function (d) {
                var saturation = mapRange(d.px, 0, 1, 0, 100);
                var value = mapRange(d.py, 0, 1, 100, 0);
                var _a = this.value.rawValue.getComponents('hsv'), h = _a[0], a = _a[3];
                this.value.rawValue = new Color([h, saturation, value, a], 'hsv');
                this.view.update();
            };
            SvPaletteController.prototype.onPointerDown_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            SvPaletteController.prototype.onPointerMove_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            SvPaletteController.prototype.onPointerUp_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            SvPaletteController.prototype.onKeyDown_ = function (ev) {
                if (isArrowKey(ev.keyCode)) {
                    ev.preventDefault();
                }
                var _a = this.value.rawValue.getComponents('hsv'), h = _a[0], s = _a[1], v = _a[2], a = _a[3];
                var baseStep = getBaseStepForColor(false);
                this.value.rawValue = new Color([
                    h,
                    s + getStepForKey(baseStep, getHorizontalStepKeys(ev)),
                    v + getStepForKey(baseStep, getVerticalStepKeys(ev)),
                    a,
                ], 'hsv');
            };
            return SvPaletteController;
        }());

        /**
         * @hidden
         */
        var ColorPickerController = /** @class */ (function () {
            function ColorPickerController(doc, config) {
                var _this = this;
                this.triggerElement = null;
                this.onFocusableElementBlur_ = this.onFocusableElementBlur_.bind(this);
                this.onKeyDown_ = this.onKeyDown_.bind(this);
                this.pickedColor = config.pickedColor;
                this.foldable = new Foldable();
                this.hPaletteIc_ = new HPaletteController(doc, {
                    value: this.pickedColor.value,
                });
                this.svPaletteIc_ = new SvPaletteController(doc, {
                    value: this.pickedColor.value,
                });
                this.alphaIcs_ = config.supportsAlpha
                    ? {
                        palette: new APaletteController(doc, {
                            value: this.pickedColor.value,
                        }),
                        text: new NumberTextController(doc, {
                            formatter: createNumberFormatter(2),
                            parser: parseNumber,
                            baseStep: 0.1,
                            value: new Value(0),
                        }),
                    }
                    : null;
                if (this.alphaIcs_) {
                    connect({
                        primary: this.pickedColor.value,
                        secondary: this.alphaIcs_.text.value,
                        forward: function (p) {
                            return p.rawValue.getComponents()[3];
                        },
                        backward: function (p, s) {
                            var comps = p.rawValue.getComponents();
                            comps[3] = s.rawValue;
                            return new Color(comps, p.rawValue.mode);
                        },
                    });
                }
                this.compTextsIc_ = new ColorComponentTextsController(doc, {
                    parser: parseNumber,
                    pickedColor: this.pickedColor,
                });
                this.view = new ColorPickerView(doc, {
                    alphaViews: this.alphaIcs_
                        ? {
                            palette: this.alphaIcs_.palette.view,
                            text: this.alphaIcs_.text.view,
                        }
                        : null,
                    componentTextsView: this.compTextsIc_.view,
                    foldable: this.foldable,
                    hPaletteView: this.hPaletteIc_.view,
                    pickedColor: this.pickedColor,
                    supportsAlpha: config.supportsAlpha,
                    svPaletteView: this.svPaletteIc_.view,
                });
                this.view.element.addEventListener('keydown', this.onKeyDown_);
                this.view.allFocusableElements.forEach(function (elem) {
                    elem.addEventListener('blur', _this.onFocusableElementBlur_);
                });
            }
            Object.defineProperty(ColorPickerController.prototype, "value", {
                get: function () {
                    return this.pickedColor.value;
                },
                enumerable: false,
                configurable: true
            });
            ColorPickerController.prototype.onFocusableElementBlur_ = function (ev) {
                var elem = this.view.element;
                var nextTarget = findNextTarget(ev);
                if (nextTarget && elem.contains(nextTarget)) {
                    // Next target is in the picker
                    return;
                }
                if (nextTarget &&
                    nextTarget === this.triggerElement &&
                    !supportsTouch(elem.ownerDocument)) {
                    // Next target is the trigger button
                    return;
                }
                this.foldable.expanded = false;
            };
            ColorPickerController.prototype.onKeyDown_ = function (ev) {
                if (ev.keyCode === 27) {
                    this.foldable.expanded = false;
                }
            };
            return ColorPickerController;
        }());

        /**
         * @hidden
         */
        var ColorSwatchController = /** @class */ (function () {
            function ColorSwatchController(doc, config) {
                this.onButtonBlur_ = this.onButtonBlur_.bind(this);
                this.onButtonClick_ = this.onButtonClick_.bind(this);
                this.value = config.value;
                this.pickerIc_ = new ColorPickerController(doc, {
                    pickedColor: new PickedColor(this.value),
                    supportsAlpha: config.supportsAlpha,
                });
                this.view = new ColorSwatchView(doc, {
                    pickerView: this.pickerIc_.view,
                    value: this.value,
                });
                this.view.buttonElement.addEventListener('blur', this.onButtonBlur_);
                this.view.buttonElement.addEventListener('click', this.onButtonClick_);
                this.pickerIc_.triggerElement = this.view.buttonElement;
            }
            ColorSwatchController.prototype.onButtonBlur_ = function (e) {
                var elem = this.view.element;
                var nextTarget = forceCast(e.relatedTarget);
                if (!nextTarget || !elem.contains(nextTarget)) {
                    this.pickerIc_.foldable.expanded = false;
                }
            };
            ColorSwatchController.prototype.onButtonClick_ = function () {
                this.pickerIc_.foldable.expanded = !this.pickerIc_.foldable.expanded;
                if (this.pickerIc_.foldable.expanded) {
                    this.pickerIc_.view.allFocusableElements[0].focus();
                }
            };
            return ColorSwatchController;
        }());

        /**
         * @hidden
         */
        var ColorSwatchTextController = /** @class */ (function () {
            function ColorSwatchTextController(doc, config) {
                this.value = config.value;
                this.swatchIc_ = new ColorSwatchController(doc, {
                    supportsAlpha: config.supportsAlpha,
                    value: this.value,
                });
                this.textIc_ = new TextController(doc, {
                    formatter: config.formatter,
                    parser: config.parser,
                    value: this.value,
                });
                this.view = new ColorSwatchTextView(doc, {
                    swatchView: this.swatchIc_.view,
                    textView: this.textIc_.view,
                });
            }
            return ColorSwatchTextController;
        }());

        /**
         * @hidden
         */
        function colorFromObject(value) {
            if (Color.isColorObject(value)) {
                return Color.fromObject(value);
            }
            return Color.black();
        }
        /**
         * @hidden
         */
        function colorToRgbNumber(value) {
            return removeAlphaComponent(value.getComponents('rgb')).reduce(function (result, comp) {
                return (result << 8) | (Math.floor(comp) & 0xff);
            }, 0);
        }
        /**
         * @hidden
         */
        function colorToRgbaNumber(value) {
            return (value.getComponents('rgb').reduce(function (result, comp, index) {
                var hex = Math.floor(index === 3 ? comp * 255 : comp) & 0xff;
                return (result << 8) | hex;
            }, 0) >>> 0);
        }
        /**
         * @hidden
         */
        function numberToRgbColor(num) {
            return new Color([(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff], 'rgb');
        }
        /**
         * @hidden
         */
        function numberToRgbaColor(num) {
            return new Color([
                (num >> 24) & 0xff,
                (num >> 16) & 0xff,
                (num >> 8) & 0xff,
                mapRange(num & 0xff, 0, 255, 0, 1),
            ], 'rgb');
        }
        /**
         * @hidden
         */
        function colorFromRgbNumber(value) {
            if (typeof value !== 'number') {
                return Color.black();
            }
            return numberToRgbColor(value);
        }
        /**
         * @hidden
         */
        function colorFromRgbaNumber(value) {
            if (typeof value !== 'number') {
                return Color.black();
            }
            return numberToRgbaColor(value);
        }

        function createColorStringWriter(notation) {
            var stringify = getColorStringifier(notation);
            return function (target, value) {
                writePrimitive(target, stringify(value));
            };
        }
        function createColorNumberWriter(supportsAlpha) {
            var colorToNumber = supportsAlpha ? colorToRgbaNumber : colorToRgbNumber;
            return function (target, value) {
                writePrimitive(target, colorToNumber(value));
            };
        }
        function writeRgbaColorObject(target, value) {
            var obj = value.toRgbaObject();
            target.writeProperty('r', obj.r);
            target.writeProperty('g', obj.g);
            target.writeProperty('b', obj.b);
            target.writeProperty('a', obj.a);
        }
        function writeRgbColorObject(target, value) {
            var obj = value.toRgbaObject();
            target.writeProperty('r', obj.r);
            target.writeProperty('g', obj.g);
            target.writeProperty('b', obj.b);
        }
        function createColorObjectWriter(supportsAlpha) {
            return supportsAlpha ? writeRgbaColorObject : writeRgbColorObject;
        }

        function shouldSupportAlpha(inputParams) {
            return 'input' in inputParams && inputParams.input === 'color.rgba';
        }
        /**
         * @hidden
         */
        var NumberColorInputPlugin = {
            id: 'input-color-number',
            binding: {
                accept: function (value, params) {
                    if (typeof value !== 'number') {
                        return null;
                    }
                    if (!('input' in params)) {
                        return null;
                    }
                    if (params.input !== 'color' &&
                        params.input !== 'color.rgb' &&
                        params.input !== 'color.rgba') {
                        return null;
                    }
                    return value;
                },
                reader: function (args) {
                    return shouldSupportAlpha(args.params)
                        ? colorFromRgbaNumber
                        : colorFromRgbNumber;
                },
                writer: function (args) {
                    return createColorNumberWriter(shouldSupportAlpha(args.params));
                },
                equals: Color.equals,
            },
            controller: function (args) {
                var supportsAlpha = shouldSupportAlpha(args.params);
                var formatter = supportsAlpha
                    ? colorToHexRgbaString
                    : colorToHexRgbString;
                return new ColorSwatchTextController(args.document, {
                    formatter: formatter,
                    parser: CompositeColorParser,
                    supportsAlpha: supportsAlpha,
                    value: args.binding.value,
                });
            },
        };

        function shouldSupportAlpha$1(initialValue) {
            return Color.isRgbaColorObject(initialValue);
        }
        /**
         * @hidden
         */
        var ObjectColorInputPlugin = {
            id: 'input-color-object',
            binding: {
                accept: function (value, _params) { return (Color.isColorObject(value) ? value : null); },
                reader: function (_args) { return colorFromObject; },
                writer: function (args) {
                    return createColorObjectWriter(shouldSupportAlpha$1(args.initialValue));
                },
                equals: Color.equals,
            },
            controller: function (args) {
                var supportsAlpha = Color.isRgbaColorObject(args.initialValue);
                var formatter = supportsAlpha
                    ? colorToHexRgbaString
                    : colorToHexRgbString;
                return new ColorSwatchTextController(args.document, {
                    formatter: formatter,
                    parser: CompositeColorParser,
                    supportsAlpha: supportsAlpha,
                    value: args.binding.value,
                });
            },
        };

        /**
         * @hidden
         */
        var StringColorInputPlugin = {
            id: 'input-color-string',
            binding: {
                accept: function (value, params) {
                    if (typeof value !== 'string') {
                        return null;
                    }
                    if ('input' in params && params.input === 'string') {
                        return null;
                    }
                    var notation = getColorNotation(value);
                    if (!notation) {
                        return null;
                    }
                    return value;
                },
                reader: function (_args) { return colorFromString; },
                writer: function (args) {
                    var notation = getColorNotation(args.initialValue);
                    if (!notation) {
                        throw TpError.shouldNeverHappen();
                    }
                    return createColorStringWriter(notation);
                },
                equals: Color.equals,
            },
            controller: function (args) {
                var notation = getColorNotation(args.initialValue);
                if (!notation) {
                    throw TpError.shouldNeverHappen();
                }
                var stringifier = getColorStringifier(notation);
                return new ColorSwatchTextController(args.document, {
                    formatter: stringifier,
                    parser: CompositeColorParser,
                    supportsAlpha: hasAlphaComponent(notation),
                    value: args.binding.value,
                });
            },
        };

        /**
         * @hidden
         */
        var RangeConstraint = /** @class */ (function () {
            function RangeConstraint(config) {
                this.maxValue = config.max;
                this.minValue = config.min;
            }
            RangeConstraint.prototype.constrain = function (value) {
                var result = value;
                if (!isEmpty(this.minValue)) {
                    result = Math.max(result, this.minValue);
                }
                if (!isEmpty(this.maxValue)) {
                    result = Math.min(result, this.maxValue);
                }
                return result;
            };
            return RangeConstraint;
        }());

        var className$g = ClassName('sldtxt');
        /**
         * @hidden
         */
        var SliderTextView = /** @class */ (function () {
            function SliderTextView(doc, config) {
                this.element = doc.createElement('div');
                this.element.classList.add(className$g());
                var sliderElem = doc.createElement('div');
                sliderElem.classList.add(className$g('s'));
                this.sliderView_ = config.sliderView;
                sliderElem.appendChild(this.sliderView_.element);
                this.element.appendChild(sliderElem);
                var textElem = doc.createElement('div');
                textElem.classList.add(className$g('t'));
                this.textView_ = config.textView;
                textElem.appendChild(this.textView_.element);
                this.element.appendChild(textElem);
            }
            Object.defineProperty(SliderTextView.prototype, "value", {
                get: function () {
                    return this.sliderView_.value;
                },
                enumerable: false,
                configurable: true
            });
            SliderTextView.prototype.update = function () {
                this.sliderView_.update();
                this.textView_.update();
            };
            return SliderTextView;
        }());

        var className$h = ClassName('sld');
        /**
         * @hidden
         */
        var SliderView = /** @class */ (function () {
            function SliderView(doc, config) {
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.minValue_ = config.minValue;
                this.maxValue_ = config.maxValue;
                this.element = doc.createElement('div');
                this.element.classList.add(className$h());
                var outerElem = doc.createElement('div');
                outerElem.classList.add(className$h('o'));
                outerElem.tabIndex = 0;
                this.element.appendChild(outerElem);
                this.outerElement = outerElem;
                var innerElem = doc.createElement('div');
                innerElem.classList.add(className$h('i'));
                this.outerElement.appendChild(innerElem);
                this.innerElement = innerElem;
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.update();
            }
            SliderView.prototype.update = function () {
                var p = constrainRange(mapRange(this.value.rawValue, this.minValue_, this.maxValue_, 0, 100), 0, 100);
                this.innerElement.style.width = p + "%";
            };
            SliderView.prototype.onValueChange_ = function () {
                this.update();
            };
            return SliderView;
        }());

        function findRange(value) {
            var c = value.constraint
                ? findConstraint(value.constraint, RangeConstraint)
                : null;
            if (!c) {
                return [undefined, undefined];
            }
            return [c.minValue, c.maxValue];
        }
        function estimateSuitableRange(value) {
            var _a = findRange(value), min = _a[0], max = _a[1];
            return [min !== null && min !== void 0 ? min : 0, max !== null && max !== void 0 ? max : 100];
        }
        /**
         * @hidden
         */
        var SliderController = /** @class */ (function () {
            function SliderController(doc, config) {
                this.onKeyDown_ = this.onKeyDown_.bind(this);
                this.onPointerDown_ = this.onPointerDown_.bind(this);
                this.onPointerMove_ = this.onPointerMove_.bind(this);
                this.onPointerUp_ = this.onPointerUp_.bind(this);
                this.value = config.value;
                this.baseStep_ = config.baseStep;
                var _a = estimateSuitableRange(this.value), min = _a[0], max = _a[1];
                this.minValue_ = min;
                this.maxValue_ = max;
                this.view = new SliderView(doc, {
                    maxValue: this.maxValue_,
                    minValue: this.minValue_,
                    value: this.value,
                });
                this.ptHandler_ = new PointerHandler(doc, this.view.outerElement);
                this.ptHandler_.emitter.on('down', this.onPointerDown_);
                this.ptHandler_.emitter.on('move', this.onPointerMove_);
                this.ptHandler_.emitter.on('up', this.onPointerUp_);
                this.view.outerElement.addEventListener('keydown', this.onKeyDown_);
            }
            SliderController.prototype.handlePointerEvent_ = function (d) {
                this.value.rawValue = mapRange(d.px, 0, 1, this.minValue_, this.maxValue_);
            };
            SliderController.prototype.onPointerDown_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            SliderController.prototype.onPointerMove_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            SliderController.prototype.onPointerUp_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            SliderController.prototype.onKeyDown_ = function (ev) {
                this.value.rawValue += getStepForKey(this.baseStep_, getHorizontalStepKeys(ev));
            };
            return SliderController;
        }());

        /**
         * @hidden
         */
        var SliderTextController = /** @class */ (function () {
            function SliderTextController(doc, config) {
                this.value = config.value;
                this.sliderIc_ = new SliderController(doc, {
                    baseStep: config.baseStep,
                    value: config.value,
                });
                this.textIc_ = new NumberTextController(doc, {
                    baseStep: config.baseStep,
                    formatter: config.formatter,
                    parser: config.parser,
                    value: config.value,
                });
                this.view = new SliderTextView(doc, {
                    sliderView: this.sliderIc_.view,
                    textView: this.textIc_.view,
                });
            }
            return SliderTextController;
        }());

        function createConstraint$1(params) {
            var constraints = [];
            if ('step' in params && !isEmpty(params.step)) {
                constraints.push(new StepConstraint({
                    step: params.step,
                }));
            }
            if (('max' in params && !isEmpty(params.max)) ||
                ('min' in params && !isEmpty(params.min))) {
                constraints.push(new RangeConstraint({
                    max: params.max,
                    min: params.min,
                }));
            }
            if ('options' in params && params.options !== undefined) {
                constraints.push(new ListConstraint({
                    options: normalizeInputParamsOptions(params.options, numberFromUnknown),
                }));
            }
            return new CompositeConstraint({
                constraints: constraints,
            });
        }
        function createController$3(doc, value) {
            var _a;
            var c = value.constraint;
            if (c && findConstraint(c, ListConstraint)) {
                return new ListController(doc, {
                    listItems: (_a = findListItems(c)) !== null && _a !== void 0 ? _a : [],
                    stringifyValue: numberToString,
                    value: value,
                });
            }
            if (c && findConstraint(c, RangeConstraint)) {
                return new SliderTextController(doc, {
                    baseStep: getBaseStep(c),
                    formatter: createNumberFormatter(getSuitableDecimalDigits(value.constraint, value.rawValue)),
                    parser: parseNumber,
                    value: value,
                });
            }
            return new NumberTextController(doc, {
                baseStep: getBaseStep(c),
                formatter: createNumberFormatter(getSuitableDecimalDigits(value.constraint, value.rawValue)),
                parser: parseNumber,
                value: value,
            });
        }
        /**
         * @hidden
         */
        var NumberInputPlugin = {
            id: 'input-number',
            binding: {
                accept: function (value) { return (typeof value === 'number' ? value : null); },
                constraint: function (args) { return createConstraint$1(args.params); },
                reader: function (_args) { return numberFromUnknown; },
                writer: function (_args) { return writePrimitive; },
            },
            controller: function (args) {
                return createController$3(args.document, args.binding.value);
            },
        };

        var Point2d = /** @class */ (function () {
            function Point2d(x, y) {
                if (x === void 0) { x = 0; }
                if (y === void 0) { y = 0; }
                this.x = x;
                this.y = y;
            }
            Point2d.prototype.getComponents = function () {
                return [this.x, this.y];
            };
            Point2d.isObject = function (obj) {
                if (isEmpty(obj)) {
                    return false;
                }
                var x = obj.x;
                var y = obj.y;
                if (typeof x !== 'number' || typeof y !== 'number') {
                    return false;
                }
                return true;
            };
            Point2d.equals = function (v1, v2) {
                return v1.x === v2.x && v1.y === v2.y;
            };
            Point2d.prototype.toObject = function () {
                return {
                    x: this.x,
                    y: this.y,
                };
            };
            return Point2d;
        }());

        /**
         * @hidden
         */
        var Point2dConstraint = /** @class */ (function () {
            function Point2dConstraint(config) {
                this.x = config.x;
                this.y = config.y;
            }
            Point2dConstraint.prototype.constrain = function (value) {
                return new Point2d(this.x ? this.x.constrain(value.x) : value.x, this.y ? this.y.constrain(value.y) : value.y);
            };
            return Point2dConstraint;
        }());

        var className$i = ClassName('p2dpadtxt');
        /**
         * @hidden
         */
        var Point2dPadTextView = /** @class */ (function () {
            function Point2dPadTextView(doc, config) {
                this.element = doc.createElement('div');
                this.element.classList.add(className$i());
                var padWrapperElem = doc.createElement('div');
                padWrapperElem.classList.add(className$i('w'));
                this.element.appendChild(padWrapperElem);
                var buttonElem = doc.createElement('button');
                buttonElem.classList.add(className$i('b'));
                buttonElem.appendChild(createSvgIconElement(doc, 'p2dpad'));
                padWrapperElem.appendChild(buttonElem);
                this.padButtonElem_ = buttonElem;
                var padElem = doc.createElement('div');
                padElem.classList.add(className$i('p'));
                padWrapperElem.appendChild(padElem);
                this.padView_ = config.padView;
                padElem.appendChild(this.padView_.element);
                var textElem = doc.createElement('div');
                textElem.classList.add(className$i('t'));
                this.textView_ = config.textView;
                textElem.appendChild(this.textView_.element);
                this.element.appendChild(textElem);
            }
            Object.defineProperty(Point2dPadTextView.prototype, "value", {
                get: function () {
                    return this.textView_.value;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Point2dPadTextView.prototype, "padButtonElement", {
                get: function () {
                    return this.padButtonElem_;
                },
                enumerable: false,
                configurable: true
            });
            Point2dPadTextView.prototype.update = function () {
                this.padView_.update();
                this.textView_.update();
            };
            return Point2dPadTextView;
        }());

        var className$j = ClassName('p2dpad');
        /**
         * @hidden
         */
        var Point2dPadView = /** @class */ (function () {
            function Point2dPadView(doc, config) {
                this.onFoldableChange_ = this.onFoldableChange_.bind(this);
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.foldable = config.foldable;
                this.foldable.emitter.on('change', this.onFoldableChange_);
                this.invertsY_ = config.invertsY;
                this.maxValue_ = config.maxValue;
                this.element = doc.createElement('div');
                this.element.classList.add(className$j());
                var padElem = doc.createElement('div');
                padElem.tabIndex = 0;
                padElem.classList.add(className$j('p'));
                this.element.appendChild(padElem);
                this.padElement = padElem;
                var svgElem = doc.createElementNS(SVG_NS, 'svg');
                svgElem.classList.add(className$j('g'));
                this.padElement.appendChild(svgElem);
                this.svgElem_ = svgElem;
                var xAxisElem = doc.createElementNS(SVG_NS, 'line');
                xAxisElem.classList.add(className$j('ax'));
                xAxisElem.setAttributeNS(null, 'x1', '0');
                xAxisElem.setAttributeNS(null, 'y1', '50%');
                xAxisElem.setAttributeNS(null, 'x2', '100%');
                xAxisElem.setAttributeNS(null, 'y2', '50%');
                this.svgElem_.appendChild(xAxisElem);
                var yAxisElem = doc.createElementNS(SVG_NS, 'line');
                yAxisElem.classList.add(className$j('ax'));
                yAxisElem.setAttributeNS(null, 'x1', '50%');
                yAxisElem.setAttributeNS(null, 'y1', '0');
                yAxisElem.setAttributeNS(null, 'x2', '50%');
                yAxisElem.setAttributeNS(null, 'y2', '100%');
                this.svgElem_.appendChild(yAxisElem);
                var lineElem = doc.createElementNS(SVG_NS, 'line');
                lineElem.classList.add(className$j('l'));
                lineElem.setAttributeNS(null, 'x1', '50%');
                lineElem.setAttributeNS(null, 'y1', '50%');
                this.svgElem_.appendChild(lineElem);
                this.lineElem_ = lineElem;
                var markerElem = doc.createElementNS(SVG_NS, 'circle');
                markerElem.classList.add(className$j('m'));
                markerElem.setAttributeNS(null, 'r', '2px');
                this.svgElem_.appendChild(markerElem);
                this.markerElem_ = markerElem;
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.update();
            }
            Object.defineProperty(Point2dPadView.prototype, "allFocusableElements", {
                get: function () {
                    return [this.padElement];
                },
                enumerable: false,
                configurable: true
            });
            Point2dPadView.prototype.update = function () {
                if (this.foldable.expanded) {
                    this.element.classList.add(className$j(undefined, 'expanded'));
                }
                else {
                    this.element.classList.remove(className$j(undefined, 'expanded'));
                }
                var _a = this.value.rawValue.getComponents(), x = _a[0], y = _a[1];
                var max = this.maxValue_;
                var px = mapRange(x, -max, +max, 0, 100);
                var py = mapRange(y, -max, +max, 0, 100);
                var ipy = this.invertsY_ ? 100 - py : py;
                this.lineElem_.setAttributeNS(null, 'x2', px + "%");
                this.lineElem_.setAttributeNS(null, 'y2', ipy + "%");
                this.markerElem_.setAttributeNS(null, 'cx', px + "%");
                this.markerElem_.setAttributeNS(null, 'cy', ipy + "%");
            };
            Point2dPadView.prototype.onValueChange_ = function () {
                this.update();
            };
            Point2dPadView.prototype.onFoldableChange_ = function () {
                this.update();
            };
            return Point2dPadView;
        }());

        /**
         * @hidden
         */
        var Point2dPadController = /** @class */ (function () {
            function Point2dPadController(doc, config) {
                var _this = this;
                this.triggerElement = null;
                this.onFocusableElementBlur_ = this.onFocusableElementBlur_.bind(this);
                this.onKeyDown_ = this.onKeyDown_.bind(this);
                this.onPadKeyDown_ = this.onPadKeyDown_.bind(this);
                this.onPointerDown_ = this.onPointerDown_.bind(this);
                this.onPointerMove_ = this.onPointerMove_.bind(this);
                this.onPointerUp_ = this.onPointerUp_.bind(this);
                this.value = config.value;
                this.foldable = new Foldable();
                this.baseSteps_ = config.baseSteps;
                this.maxValue_ = config.maxValue;
                this.invertsY_ = config.invertsY;
                this.view = new Point2dPadView(doc, {
                    foldable: this.foldable,
                    invertsY: this.invertsY_,
                    maxValue: this.maxValue_,
                    value: this.value,
                });
                this.ptHandler_ = new PointerHandler(doc, this.view.padElement);
                this.ptHandler_.emitter.on('down', this.onPointerDown_);
                this.ptHandler_.emitter.on('move', this.onPointerMove_);
                this.ptHandler_.emitter.on('up', this.onPointerUp_);
                this.view.padElement.addEventListener('keydown', this.onPadKeyDown_);
                this.view.element.addEventListener('keydown', this.onKeyDown_);
                this.view.allFocusableElements.forEach(function (elem) {
                    elem.addEventListener('blur', _this.onFocusableElementBlur_);
                });
            }
            Point2dPadController.prototype.handlePointerEvent_ = function (d) {
                var max = this.maxValue_;
                var px = mapRange(d.px, 0, 1, -max, +max);
                var py = mapRange(this.invertsY_ ? 1 - d.py : d.py, 0, 1, -max, +max);
                this.value.rawValue = new Point2d(px, py);
                this.view.update();
            };
            Point2dPadController.prototype.onPointerDown_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            Point2dPadController.prototype.onPointerMove_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            Point2dPadController.prototype.onPointerUp_ = function (ev) {
                this.handlePointerEvent_(ev.data);
            };
            Point2dPadController.prototype.onPadKeyDown_ = function (ev) {
                if (isArrowKey(ev.keyCode)) {
                    ev.preventDefault();
                }
                this.value.rawValue = new Point2d(this.value.rawValue.x +
                    getStepForKey(this.baseSteps_[0], getHorizontalStepKeys(ev)), this.value.rawValue.y +
                    getStepForKey(this.baseSteps_[1], getVerticalStepKeys(ev)) *
                        (this.invertsY_ ? 1 : -1));
            };
            Point2dPadController.prototype.onFocusableElementBlur_ = function (ev) {
                var elem = this.view.element;
                var nextTarget = findNextTarget(ev);
                if (nextTarget && elem.contains(nextTarget)) {
                    // Next target is in the picker
                    return;
                }
                if (nextTarget &&
                    nextTarget === this.triggerElement &&
                    !supportsTouch(elem.ownerDocument)) {
                    // Next target is the trigger button
                    return;
                }
                this.foldable.expanded = false;
            };
            Point2dPadController.prototype.onKeyDown_ = function (ev) {
                if (ev.keyCode === 27) {
                    this.foldable.expanded = false;
                }
            };
            return Point2dPadController;
        }());

        var className$k = ClassName('p2dtxt');
        /**
         * @hidden
         */
        var Point2dTextView = /** @class */ (function () {
            function Point2dTextView(doc, config) {
                var _this = this;
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.formatters_ = config.formatters;
                this.element = doc.createElement('div');
                this.element.classList.add(className$k());
                var inputElems = [0, 1].map(function () {
                    var inputElem = doc.createElement('input');
                    inputElem.classList.add(className$k('i'));
                    inputElem.type = 'text';
                    return inputElem;
                });
                [0, 1].forEach(function (_, index) {
                    var elem = doc.createElement('div');
                    elem.classList.add(className$k('w'));
                    elem.appendChild(inputElems[index]);
                    _this.element.appendChild(elem);
                });
                this.inputElems_ = [inputElems[0], inputElems[1]];
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.update();
            }
            Object.defineProperty(Point2dTextView.prototype, "inputElements", {
                get: function () {
                    return this.inputElems_;
                },
                enumerable: false,
                configurable: true
            });
            Point2dTextView.prototype.update = function () {
                var _this = this;
                var xyComps = this.value.rawValue.getComponents();
                xyComps.forEach(function (comp, index) {
                    var inputElem = _this.inputElems_[index];
                    inputElem.value = _this.formatters_[index](comp);
                });
            };
            Point2dTextView.prototype.onValueChange_ = function () {
                this.update();
            };
            return Point2dTextView;
        }());

        /**
         * @hidden
         */
        var Point2dTextController = /** @class */ (function () {
            function Point2dTextController(doc, config) {
                var _this = this;
                this.onInputChange_ = this.onInputChange_.bind(this);
                this.onInputKeyDown_ = this.onInputKeyDown_.bind(this);
                this.parser_ = config.parser;
                this.value = config.value;
                this.baseSteps_ = [config.axes[0].baseStep, config.axes[1].baseStep];
                this.view = new Point2dTextView(doc, {
                    formatters: [config.axes[0].formatter, config.axes[1].formatter],
                    value: this.value,
                });
                this.view.inputElements.forEach(function (inputElem) {
                    inputElem.addEventListener('change', _this.onInputChange_);
                    inputElem.addEventListener('keydown', _this.onInputKeyDown_);
                });
            }
            Point2dTextController.prototype.findIndexOfInputElem_ = function (inputElem) {
                var inputElems = this.view.inputElements;
                for (var i = 0; i < inputElems.length; i++) {
                    if (inputElems[i] === inputElem) {
                        return i;
                    }
                }
                return null;
            };
            Point2dTextController.prototype.updateComponent_ = function (index, newValue) {
                var comps = this.value.rawValue.getComponents();
                var newComps = comps.map(function (comp, i) {
                    return i === index ? newValue : comp;
                });
                this.value.rawValue = new Point2d(newComps[0], newComps[1]);
                this.view.update();
            };
            Point2dTextController.prototype.onInputChange_ = function (e) {
                var inputElem = forceCast(e.currentTarget);
                var parsedValue = this.parser_(inputElem.value);
                if (isEmpty(parsedValue)) {
                    return;
                }
                var compIndex = this.findIndexOfInputElem_(inputElem);
                if (isEmpty(compIndex)) {
                    return;
                }
                this.updateComponent_(compIndex, parsedValue);
            };
            Point2dTextController.prototype.onInputKeyDown_ = function (e) {
                var inputElem = forceCast(e.currentTarget);
                var parsedValue = this.parser_(inputElem.value);
                if (isEmpty(parsedValue)) {
                    return;
                }
                var compIndex = this.findIndexOfInputElem_(inputElem);
                if (isEmpty(compIndex)) {
                    return;
                }
                var step = getStepForKey(this.baseSteps_[compIndex], getVerticalStepKeys(e));
                if (step === 0) {
                    return;
                }
                this.updateComponent_(compIndex, parsedValue + step);
            };
            return Point2dTextController;
        }());

        /**
         * @hidden
         */
        var Point2dPadTextController = /** @class */ (function () {
            function Point2dPadTextController(doc, config) {
                this.onPadButtonBlur_ = this.onPadButtonBlur_.bind(this);
                this.onPadButtonClick_ = this.onPadButtonClick_.bind(this);
                this.value = config.value;
                this.padIc_ = new Point2dPadController(doc, {
                    baseSteps: [config.axes[0].baseStep, config.axes[1].baseStep],
                    invertsY: config.invertsY,
                    maxValue: config.maxValue,
                    value: this.value,
                });
                this.textIc_ = new Point2dTextController(doc, {
                    axes: config.axes,
                    parser: config.parser,
                    value: this.value,
                });
                this.view = new Point2dPadTextView(doc, {
                    padView: this.padIc_.view,
                    textView: this.textIc_.view,
                });
                this.view.padButtonElement.addEventListener('blur', this.onPadButtonBlur_);
                this.view.padButtonElement.addEventListener('click', this.onPadButtonClick_);
                this.padIc_.triggerElement = this.view.padButtonElement;
            }
            Point2dPadTextController.prototype.onPadButtonBlur_ = function (e) {
                var elem = this.view.element;
                var nextTarget = forceCast(e.relatedTarget);
                if (!nextTarget || !elem.contains(nextTarget)) {
                    this.padIc_.foldable.expanded = false;
                }
            };
            Point2dPadTextController.prototype.onPadButtonClick_ = function () {
                this.padIc_.foldable.expanded = !this.padIc_.foldable.expanded;
                if (this.padIc_.foldable.expanded) {
                    this.padIc_.view.allFocusableElements[0].focus();
                }
            };
            return Point2dPadTextController;
        }());

        /**
         * @hidden
         */
        function point2dFromUnknown(value) {
            return Point2d.isObject(value)
                ? new Point2d(value.x, value.y)
                : new Point2d();
        }

        function writePoint2d(target, value) {
            target.writeProperty('x', value.x);
            target.writeProperty('y', value.y);
        }

        function createDimensionConstraint(params) {
            if (!params) {
                return undefined;
            }
            var constraints = [];
            if (!isEmpty(params.step)) {
                constraints.push(new StepConstraint({
                    step: params.step,
                }));
            }
            if (!isEmpty(params.max) || !isEmpty(params.min)) {
                constraints.push(new RangeConstraint({
                    max: params.max,
                    min: params.min,
                }));
            }
            return new CompositeConstraint({
                constraints: constraints,
            });
        }
        function createConstraint$2(params) {
            return new Point2dConstraint({
                x: createDimensionConstraint('x' in params ? params.x : undefined),
                y: createDimensionConstraint('y' in params ? params.y : undefined),
            });
        }
        function getSuitableMaxDimensionValue(constraint, rawValue) {
            var rc = constraint && findConstraint(constraint, RangeConstraint);
            if (rc) {
                return Math.max(Math.abs(rc.minValue || 0), Math.abs(rc.maxValue || 0));
            }
            var step = getBaseStep(constraint);
            return Math.max(Math.abs(step) * 10, Math.abs(rawValue) * 10);
        }
        /**
         * @hidden
         */
        function getSuitableMaxValue(initialValue, constraint) {
            var xc = constraint instanceof Point2dConstraint ? constraint.x : undefined;
            var yc = constraint instanceof Point2dConstraint ? constraint.y : undefined;
            var xr = getSuitableMaxDimensionValue(xc, initialValue.x);
            var yr = getSuitableMaxDimensionValue(yc, initialValue.y);
            return Math.max(xr, yr);
        }
        function createController$4(document, value, invertsY) {
            var c = value.constraint;
            if (!(c instanceof Point2dConstraint)) {
                throw TpError.shouldNeverHappen();
            }
            return new Point2dPadTextController(document, {
                axes: [
                    {
                        baseStep: getBaseStep(c.x),
                        formatter: createNumberFormatter(getSuitableDecimalDigits(c.x, value.rawValue.x)),
                    },
                    {
                        baseStep: getBaseStep(c.y),
                        formatter: createNumberFormatter(getSuitableDecimalDigits(c.y, value.rawValue.y)),
                    },
                ],
                invertsY: invertsY,
                maxValue: getSuitableMaxValue(value.rawValue, value.constraint),
                parser: parseNumber,
                value: value,
            });
        }
        function shouldInvertY(params) {
            if (!('y' in params)) {
                return false;
            }
            var yParams = params.y;
            if (!yParams) {
                return false;
            }
            return 'inverted' in yParams ? !!yParams.inverted : false;
        }
        /**
         * @hidden
         */
        var Point2dInputPlugin = {
            id: 'input-point2d',
            binding: {
                accept: function (value, _params) { return (Point2d.isObject(value) ? value : null); },
                reader: function (_args) { return point2dFromUnknown; },
                writer: function (_args) { return writePoint2d; },
                constraint: function (args) { return createConstraint$2(args.params); },
                equals: Point2d.equals,
            },
            controller: function (args) {
                return createController$4(args.document, args.binding.value, shouldInvertY(args.params));
            },
        };

        var Point3d = /** @class */ (function () {
            function Point3d(x, y, z) {
                if (x === void 0) { x = 0; }
                if (y === void 0) { y = 0; }
                if (z === void 0) { z = 0; }
                this.x = x;
                this.y = y;
                this.z = z;
            }
            Point3d.prototype.getComponents = function () {
                return [this.x, this.y, this.z];
            };
            Point3d.isObject = function (obj) {
                if (isEmpty(obj)) {
                    return false;
                }
                var x = obj.x;
                var y = obj.y;
                var z = obj.z;
                if (typeof x !== 'number' ||
                    typeof y !== 'number' ||
                    typeof z !== 'number') {
                    return false;
                }
                return true;
            };
            Point3d.equals = function (v1, v2) {
                return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
            };
            Point3d.prototype.toObject = function () {
                return {
                    x: this.x,
                    y: this.y,
                    z: this.z,
                };
            };
            return Point3d;
        }());

        /**
         * @hidden
         */
        var Point3dConstraint = /** @class */ (function () {
            function Point3dConstraint(config) {
                this.x = config.x;
                this.y = config.y;
                this.z = config.z;
            }
            Point3dConstraint.prototype.constrain = function (value) {
                return new Point3d(this.x ? this.x.constrain(value.x) : value.x, this.y ? this.y.constrain(value.y) : value.y, this.z ? this.z.constrain(value.z) : value.z);
            };
            return Point3dConstraint;
        }());

        var className$l = ClassName('p3dtxt');
        /**
         * @hidden
         */
        var Point3dTextView = /** @class */ (function () {
            function Point3dTextView(doc, config) {
                var _this = this;
                this.onValueChange_ = this.onValueChange_.bind(this);
                this.formatters_ = config.formatters;
                this.element = doc.createElement('div');
                this.element.classList.add(className$l());
                var inputElems = [0, 1, 2].map(function () {
                    var inputElem = doc.createElement('input');
                    inputElem.classList.add(className$l('i'));
                    inputElem.type = 'text';
                    return inputElem;
                });
                [0, 1, 2].forEach(function (_, index) {
                    var elem = doc.createElement('div');
                    elem.classList.add(className$l('w'));
                    elem.appendChild(inputElems[index]);
                    _this.element.appendChild(elem);
                });
                this.inputElems_ = [inputElems[0], inputElems[1], inputElems[2]];
                config.value.emitter.on('change', this.onValueChange_);
                this.value = config.value;
                this.update();
            }
            Object.defineProperty(Point3dTextView.prototype, "inputElements", {
                get: function () {
                    return this.inputElems_;
                },
                enumerable: false,
                configurable: true
            });
            Point3dTextView.prototype.update = function () {
                var _this = this;
                var comps = this.value.rawValue.getComponents();
                comps.forEach(function (comp, index) {
                    var inputElem = _this.inputElems_[index];
                    inputElem.value = _this.formatters_[index](comp);
                });
            };
            Point3dTextView.prototype.onValueChange_ = function () {
                this.update();
            };
            return Point3dTextView;
        }());

        /**
         * @hidden
         */
        var Point3dTextController = /** @class */ (function () {
            function Point3dTextController(doc, config) {
                var _this = this;
                this.onInputChange_ = this.onInputChange_.bind(this);
                this.onInputKeyDown_ = this.onInputKeyDown_.bind(this);
                this.parser_ = config.parser;
                this.value = config.value;
                var axes = config.axes;
                this.baseSteps_ = [axes[0].baseStep, axes[1].baseStep, axes[2].baseStep];
                this.view = new Point3dTextView(doc, {
                    formatters: [axes[0].formatter, axes[1].formatter, axes[2].formatter],
                    value: this.value,
                });
                this.view.inputElements.forEach(function (inputElem) {
                    inputElem.addEventListener('change', _this.onInputChange_);
                    inputElem.addEventListener('keydown', _this.onInputKeyDown_);
                });
            }
            Point3dTextController.prototype.findIndexOfInputElem_ = function (inputElem) {
                var inputElems = this.view.inputElements;
                for (var i = 0; i < inputElems.length; i++) {
                    if (inputElems[i] === inputElem) {
                        return i;
                    }
                }
                return null;
            };
            Point3dTextController.prototype.updateComponent_ = function (index, newValue) {
                var comps = this.value.rawValue.getComponents();
                var newComps = comps.map(function (comp, i) {
                    return i === index ? newValue : comp;
                });
                this.value.rawValue = new Point3d(newComps[0], newComps[1], newComps[2]);
                this.view.update();
            };
            Point3dTextController.prototype.onInputChange_ = function (e) {
                var inputElem = forceCast(e.currentTarget);
                var parsedValue = this.parser_(inputElem.value);
                if (isEmpty(parsedValue)) {
                    return;
                }
                var compIndex = this.findIndexOfInputElem_(inputElem);
                if (isEmpty(compIndex)) {
                    return;
                }
                this.updateComponent_(compIndex, parsedValue);
            };
            Point3dTextController.prototype.onInputKeyDown_ = function (e) {
                var inputElem = forceCast(e.currentTarget);
                var parsedValue = this.parser_(inputElem.value);
                if (isEmpty(parsedValue)) {
                    return;
                }
                var compIndex = this.findIndexOfInputElem_(inputElem);
                if (isEmpty(compIndex)) {
                    return;
                }
                var step = getStepForKey(this.baseSteps_[compIndex], getVerticalStepKeys(e));
                if (step === 0) {
                    return;
                }
                this.updateComponent_(compIndex, parsedValue + step);
            };
            return Point3dTextController;
        }());

        /**
         * @hidden
         */
        function point3dFromUnknown(value) {
            return Point3d.isObject(value)
                ? new Point3d(value.x, value.y, value.z)
                : new Point3d();
        }

        function writePoint3d(target, value) {
            target.writeProperty('x', value.x);
            target.writeProperty('y', value.y);
            target.writeProperty('z', value.z);
        }

        function createDimensionConstraint$1(params) {
            if (!params) {
                return undefined;
            }
            var constraints = [];
            if (!isEmpty(params.step)) {
                constraints.push(new StepConstraint({
                    step: params.step,
                }));
            }
            if (!isEmpty(params.max) || !isEmpty(params.min)) {
                constraints.push(new RangeConstraint({
                    max: params.max,
                    min: params.min,
                }));
            }
            return new CompositeConstraint({
                constraints: constraints,
            });
        }
        function createConstraint$3(params) {
            return new Point3dConstraint({
                x: createDimensionConstraint$1('x' in params ? params.x : undefined),
                y: createDimensionConstraint$1('y' in params ? params.y : undefined),
                z: createDimensionConstraint$1('z' in params ? params.z : undefined),
            });
        }
        /**
         * @hidden
         */
        function getAxis(initialValue, constraint) {
            return {
                baseStep: getBaseStep(constraint),
                formatter: createNumberFormatter(getSuitableDecimalDigits(constraint, initialValue)),
            };
        }
        function createController$5(document, value) {
            var c = value.constraint;
            if (!(c instanceof Point3dConstraint)) {
                throw TpError.shouldNeverHappen();
            }
            return new Point3dTextController(document, {
                axes: [
                    getAxis(value.rawValue.x, c.x),
                    getAxis(value.rawValue.y, c.y),
                    getAxis(value.rawValue.z, c.z),
                ],
                parser: parseNumber,
                value: value,
            });
        }
        /**
         * @hidden
         */
        var Point3dInputPlugin = {
            id: 'input-point3d',
            binding: {
                accept: function (value, _params) { return (Point3d.isObject(value) ? value : null); },
                reader: function (_args) { return point3dFromUnknown; },
                writer: function (_args) { return writePoint3d; },
                constraint: function (args) { return createConstraint$3(args.params); },
                equals: Point3d.equals,
            },
            controller: function (args) {
                return createController$5(args.document, args.binding.value);
            },
        };

        /**
         * @hidden
         */
        function stringFromUnknown(value) {
            return String(value);
        }
        /**
         * @hidden
         */
        function formatString(value) {
            return value;
        }

        function createConstraint$4(params) {
            var constraints = [];
            if ('options' in params && params.options !== undefined) {
                constraints.push(new ListConstraint({
                    options: normalizeInputParamsOptions(params.options, stringFromUnknown),
                }));
            }
            return new CompositeConstraint({
                constraints: constraints,
            });
        }
        function createController$6(doc, value) {
            var _a;
            var c = value.constraint;
            if (c && findConstraint(c, ListConstraint)) {
                return new ListController(doc, {
                    listItems: (_a = findListItems(c)) !== null && _a !== void 0 ? _a : [],
                    stringifyValue: function (v) { return v; },
                    value: value,
                });
            }
            return new TextController(doc, {
                formatter: formatString,
                parser: function (v) { return v; },
                value: value,
            });
        }
        /**
         * @hidden
         */
        var StringInputPlugin = {
            id: 'input-string',
            binding: {
                accept: function (value, _params) { return (typeof value === 'string' ? value : null); },
                constraint: function (args) { return createConstraint$4(args.params); },
                reader: function (_args) { return stringFromUnknown; },
                writer: function (_args) { return writePrimitive; },
            },
            controller: function (params) {
                return createController$6(params.document, params.binding.value);
            },
        };

        var className$m = ClassName('mll');
        /**
         * @hidden
         */
        var MultiLogView = /** @class */ (function () {
            function MultiLogView(doc, config) {
                this.onValueUpdate_ = this.onValueUpdate_.bind(this);
                this.formatter_ = config.formatter;
                this.element = doc.createElement('div');
                this.element.classList.add(className$m());
                var textareaElem = doc.createElement('textarea');
                textareaElem.classList.add(className$m('i'));
                textareaElem.style.height = "calc(var(--unit-size) * " + config.lineCount + ")";
                textareaElem.readOnly = true;
                this.element.appendChild(textareaElem);
                this.textareaElem_ = textareaElem;
                config.value.emitter.on('change', this.onValueUpdate_);
                this.value = config.value;
                this.update();
            }
            MultiLogView.prototype.update = function () {
                var _this = this;
                var elem = this.textareaElem_;
                var shouldScroll = elem.scrollTop === elem.scrollHeight - elem.clientHeight;
                elem.textContent = this.value.rawValue
                    .map(function (value) {
                    return value !== undefined ? _this.formatter_(value) : '';
                })
                    .join('\n');
                if (shouldScroll) {
                    elem.scrollTop = elem.scrollHeight;
                }
            };
            MultiLogView.prototype.onValueUpdate_ = function () {
                this.update();
            };
            return MultiLogView;
        }());

        /**
         * @hidden
         */
        var MultiLogController = /** @class */ (function () {
            function MultiLogController(doc, config) {
                this.value = config.value;
                this.view = new MultiLogView(doc, {
                    formatter: config.formatter,
                    lineCount: config.lineCount,
                    value: this.value,
                });
            }
            return MultiLogController;
        }());

        var className$n = ClassName('sgl');
        /**
         * @hidden
         */
        var SingleLogView = /** @class */ (function () {
            function SingleLogView(doc, config) {
                this.onValueUpdate_ = this.onValueUpdate_.bind(this);
                this.formatter_ = config.formatter;
                this.element = doc.createElement('div');
                this.element.classList.add(className$n());
                var inputElem = doc.createElement('input');
                inputElem.classList.add(className$n('i'));
                inputElem.readOnly = true;
                inputElem.type = 'text';
                this.element.appendChild(inputElem);
                this.inputElem_ = inputElem;
                config.value.emitter.on('change', this.onValueUpdate_);
                this.value = config.value;
                this.update();
            }
            SingleLogView.prototype.update = function () {
                var values = this.value.rawValue;
                var lastValue = values[values.length - 1];
                this.inputElem_.value =
                    lastValue !== undefined ? this.formatter_(lastValue) : '';
            };
            SingleLogView.prototype.onValueUpdate_ = function () {
                this.update();
            };
            return SingleLogView;
        }());

        /**
         * @hidden
         */
        var SingleLogMonitorController = /** @class */ (function () {
            function SingleLogMonitorController(doc, config) {
                this.value = config.value;
                this.view = new SingleLogView(doc, {
                    formatter: config.formatter,
                    value: this.value,
                });
            }
            return SingleLogMonitorController;
        }());

        /**
         * @hidden
         */
        var BooleanMonitorPlugin = {
            id: 'monitor-bool',
            binding: {
                accept: function (value, _params) { return (typeof value === 'boolean' ? value : null); },
                reader: function (_args) { return boolFromUnknown; },
            },
            controller: function (args) {
                var _a;
                if (args.binding.value.rawValue.length === 1) {
                    return new SingleLogMonitorController(args.document, {
                        formatter: BooleanFormatter,
                        value: args.binding.value,
                    });
                }
                return new MultiLogController(args.document, {
                    formatter: BooleanFormatter,
                    lineCount: (_a = args.params.lineCount) !== null && _a !== void 0 ? _a : Constants.monitor.defaultLineCount,
                    value: args.binding.value,
                });
            },
        };

        /**
         * @hidden
         */
        var GraphCursor = /** @class */ (function () {
            function GraphCursor() {
                this.emitter = new Emitter();
                this.index_ = -1;
            }
            Object.defineProperty(GraphCursor.prototype, "index", {
                get: function () {
                    return this.index_;
                },
                set: function (index) {
                    var changed = this.index_ !== index;
                    if (changed) {
                        this.index_ = index;
                        this.emitter.emit('change', {
                            index: index,
                            sender: this,
                        });
                    }
                },
                enumerable: false,
                configurable: true
            });
            return GraphCursor;
        }());

        var className$o = ClassName('grl');
        /**
         * @hidden
         */
        var GraphLogView = /** @class */ (function () {
            function GraphLogView(doc, config) {
                this.onCursorChange_ = this.onCursorChange_.bind(this);
                this.onValueUpdate_ = this.onValueUpdate_.bind(this);
                this.element = doc.createElement('div');
                this.element.classList.add(className$o());
                this.formatter_ = config.formatter;
                this.minValue_ = config.minValue;
                this.maxValue_ = config.maxValue;
                this.cursor_ = config.cursor;
                this.cursor_.emitter.on('change', this.onCursorChange_);
                var svgElem = doc.createElementNS(SVG_NS, 'svg');
                svgElem.classList.add(className$o('g'));
                svgElem.style.height = "calc(var(--unit-size) * " + config.lineCount + ")";
                this.element.appendChild(svgElem);
                this.svgElem_ = svgElem;
                var lineElem = doc.createElementNS(SVG_NS, 'polyline');
                this.svgElem_.appendChild(lineElem);
                this.lineElem_ = lineElem;
                var tooltipElem = doc.createElement('div');
                tooltipElem.classList.add(className$o('t'));
                this.element.appendChild(tooltipElem);
                this.tooltipElem_ = tooltipElem;
                config.value.emitter.on('change', this.onValueUpdate_);
                this.value = config.value;
                this.update();
            }
            Object.defineProperty(GraphLogView.prototype, "graphElement", {
                get: function () {
                    return this.svgElem_;
                },
                enumerable: false,
                configurable: true
            });
            GraphLogView.prototype.update = function () {
                var bounds = this.svgElem_.getBoundingClientRect();
                // Graph
                var maxIndex = this.value.rawValue.length - 1;
                var min = this.minValue_;
                var max = this.maxValue_;
                var points = [];
                this.value.rawValue.forEach(function (v, index) {
                    if (v === undefined) {
                        return;
                    }
                    var x = mapRange(index, 0, maxIndex, 0, bounds.width);
                    var y = mapRange(v, min, max, bounds.height, 0);
                    points.push([x, y].join(','));
                });
                this.lineElem_.setAttributeNS(null, 'points', points.join(' '));
                // Cursor
                var tooltipElem = this.tooltipElem_;
                var value = this.value.rawValue[this.cursor_.index];
                if (value === undefined) {
                    tooltipElem.classList.remove(className$o('t', 'valid'));
                    return;
                }
                tooltipElem.classList.add(className$o('t', 'valid'));
                var tx = mapRange(this.cursor_.index, 0, maxIndex, 0, bounds.width);
                var ty = mapRange(value, min, max, bounds.height, 0);
                tooltipElem.style.left = tx + "px";
                tooltipElem.style.top = ty + "px";
                tooltipElem.textContent = "" + this.formatter_(value);
            };
            GraphLogView.prototype.onValueUpdate_ = function () {
                this.update();
            };
            GraphLogView.prototype.onCursorChange_ = function () {
                this.update();
            };
            return GraphLogView;
        }());

        /**
         * @hidden
         */
        var GraphLogController = /** @class */ (function () {
            function GraphLogController(doc, config) {
                this.onGraphMouseLeave_ = this.onGraphMouseLeave_.bind(this);
                this.onGraphMouseMove_ = this.onGraphMouseMove_.bind(this);
                this.value = config.value;
                this.cursor_ = new GraphCursor();
                this.view = new GraphLogView(doc, {
                    cursor: this.cursor_,
                    formatter: config.formatter,
                    lineCount: config.lineCount,
                    maxValue: config.maxValue,
                    minValue: config.minValue,
                    value: this.value,
                });
                this.view.element.addEventListener('mouseleave', this.onGraphMouseLeave_);
                this.view.element.addEventListener('mousemove', this.onGraphMouseMove_);
            }
            GraphLogController.prototype.onGraphMouseLeave_ = function () {
                this.cursor_.index = -1;
            };
            GraphLogController.prototype.onGraphMouseMove_ = function (e) {
                var bounds = this.view.graphElement.getBoundingClientRect();
                var x = e.offsetX;
                this.cursor_.index = Math.floor(mapRange(x, 0, bounds.width, 0, this.value.rawValue.length));
            };
            return GraphLogController;
        }());

        function createFormatter() {
            // TODO: formatter precision
            return createNumberFormatter(2);
        }
        function createTextMonitor(document, binding, params) {
            var _a;
            if (binding.value.rawValue.length === 1) {
                return new SingleLogMonitorController(document, {
                    formatter: createFormatter(),
                    value: binding.value,
                });
            }
            return new MultiLogController(document, {
                formatter: createFormatter(),
                lineCount: (_a = params.lineCount) !== null && _a !== void 0 ? _a : Constants.monitor.defaultLineCount,
                value: binding.value,
            });
        }
        function createGraphMonitor(_a) {
            var _b, _c, _d;
            var document = _a.document, binding = _a.binding, params = _a.params;
            return new GraphLogController(document, {
                formatter: createFormatter(),
                lineCount: (_b = params.lineCount) !== null && _b !== void 0 ? _b : Constants.monitor.defaultLineCount,
                maxValue: (_c = ('max' in params ? params.max : null)) !== null && _c !== void 0 ? _c : 100,
                minValue: (_d = ('min' in params ? params.min : null)) !== null && _d !== void 0 ? _d : 0,
                value: binding.value,
            });
        }
        function shouldShowGraph(params) {
            return 'view' in params && params.view === 'graph';
        }
        /**
         * @hidden
         */
        var NumberMonitorPlugin = {
            id: 'monitor-number',
            binding: {
                accept: function (value, _params) { return (typeof value === 'number' ? value : null); },
                defaultBufferSize: function (params) { return (shouldShowGraph(params) ? 64 : 1); },
                reader: function (_args) { return numberFromUnknown; },
            },
            controller: function (args) {
                if (shouldShowGraph(args.params)) {
                    return createGraphMonitor({
                        document: args.document,
                        binding: args.binding,
                        params: args.params,
                    });
                }
                return createTextMonitor(args.document, args.binding, args.params);
            },
        };

        /**
         * @hidden
         */
        var StringMonitorPlugin = {
            id: 'monitor-string',
            binding: {
                accept: function (value, _params) { return (typeof value === 'string' ? value : null); },
                reader: function (_args) { return stringFromUnknown; },
            },
            controller: function (args) {
                var _a;
                var value = args.binding.value;
                var multiline = value.rawValue.length > 1 ||
                    ('multiline' in args.params && args.params.multiline);
                if (multiline) {
                    return new MultiLogController(args.document, {
                        formatter: formatString,
                        lineCount: (_a = args.params.lineCount) !== null && _a !== void 0 ? _a : Constants.monitor.defaultLineCount,
                        value: value,
                    });
                }
                return new SingleLogMonitorController(args.document, {
                    formatter: formatString,
                    value: value,
                });
            },
        };

        function createDefaultWrapperElement(doc) {
            var elem = doc.createElement('div');
            elem.classList.add(ClassName('dfw')());
            if (doc.body) {
                doc.body.appendChild(elem);
            }
            return elem;
        }
        function embedStyle(doc, id, css) {
            if (doc.querySelector("style[data-tp-style=" + id + "]")) {
                return;
            }
            var styleElem = doc.createElement('style');
            styleElem.dataset.tpStyle = id;
            styleElem.textContent = css;
            doc.head.appendChild(styleElem);
        }
        function embedDefaultStyleIfNeeded(doc) {
            embedStyle(doc, 'default', '.tp-btnv_b,.tp-lstv_s,.tp-p2dpadtxtv_b,.tp-fldv_t,.tp-rotv_t,.tp-cctxtsv_i,.tp-cswv_sw,.tp-p2dpadv_p,.tp-p2dtxtv_i,.tp-p3dtxtv_i,.tp-txtv_i,.tp-grlv_g,.tp-sglv_i,.tp-mllv_i,.tp-ckbv_i,.tp-cctxtsv_ms{-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:transparent;border-width:0;font-family:inherit;font-size:inherit;font-weight:inherit;margin:0;outline:none;padding:0}.tp-btnv_b,.tp-lstv_s,.tp-p2dpadtxtv_b{background-color:var(--button-background-color);border-radius:2px;color:var(--button-foreground-color);cursor:pointer;display:block;font-weight:bold;height:var(--unit-size);line-height:var(--unit-size);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tp-btnv_b:hover,.tp-lstv_s:hover,.tp-p2dpadtxtv_b:hover{background-color:var(--button-background-color-hover)}.tp-btnv_b:focus,.tp-lstv_s:focus,.tp-p2dpadtxtv_b:focus{background-color:var(--button-background-color-focus)}.tp-btnv_b:active,.tp-lstv_s:active,.tp-p2dpadtxtv_b:active{background-color:var(--button-background-color-active)}.tp-fldv_t,.tp-rotv_t{background-color:var(--folder-background-color);color:var(--folder-foreground-color);cursor:pointer;display:block;height:calc(var(--unit-size) + 4px);line-height:calc(var(--unit-size) + 4px);overflow:hidden;padding-left:28px;position:relative;text-align:left;text-overflow:ellipsis;white-space:nowrap;width:100%;transition:border-radius .2s ease-in-out .2s}.tp-fldv_t:hover,.tp-rotv_t:hover{background-color:var(--folder-background-color-hover)}.tp-fldv_t:focus,.tp-rotv_t:focus{background-color:var(--folder-background-color-focus)}.tp-fldv_t:active,.tp-rotv_t:active{background-color:var(--folder-background-color-active)}.tp-fldv_m,.tp-rotv_m{background:linear-gradient(to left, var(--folder-foreground-color), var(--folder-foreground-color) 2px, transparent 2px, transparent 4px, var(--folder-foreground-color) 4px);border-radius:2px;bottom:0;content:\'\';display:block;height:6px;left:13px;margin:auto;opacity:0.5;position:absolute;top:0;transform:rotate(90deg);transition:transform .2s ease-in-out;width:6px}.tp-fldv.tp-fldv-expanded>.tp-fldv_t>.tp-fldv_m,.tp-rotv.tp-rotv-expanded .tp-rotv_m{transform:none}.tp-fldv_c,.tp-rotv_c{box-sizing:border-box;height:0;opacity:0;overflow:hidden;padding-bottom:0;padding-top:0;position:relative;transition:height .2s ease-in-out,opacity .2s linear,padding .2s ease-in-out}.tp-fldv_c>.tp-fldv.tp-v-first,.tp-rotv_c>.tp-fldv.tp-v-first{margin-top:-4px}.tp-fldv_c>.tp-fldv.tp-v-last,.tp-rotv_c>.tp-fldv.tp-v-last{margin-bottom:-4px}.tp-fldv_c>*:not(.tp-v-first),.tp-rotv_c>*:not(.tp-v-first){margin-top:4px}.tp-fldv_c>.tp-fldv:not(.tp-v-hidden)+.tp-fldv,.tp-rotv_c>.tp-fldv:not(.tp-v-hidden)+.tp-fldv{margin-top:0}.tp-fldv_c>.tp-sptv:not(.tp-v-hidden)+.tp-sptv,.tp-rotv_c>.tp-sptv:not(.tp-v-hidden)+.tp-sptv{margin-top:0}.tp-fldv.tp-fldv-expanded>.tp-fldv_c,.tp-rotv.tp-rotv-expanded .tp-rotv_c{opacity:1;padding-bottom:4px;padding-top:4px;transform:none;overflow:visible;transition:height .2s ease-in-out,opacity .2s linear .2s,padding .2s ease-in-out}.tp-cctxtsv_i,.tp-cswv_sw,.tp-p2dpadv_p,.tp-p2dtxtv_i,.tp-p3dtxtv_i,.tp-txtv_i{background-color:var(--input-background-color);border-radius:2px;box-sizing:border-box;color:var(--input-foreground-color);font-family:inherit;height:var(--unit-size);line-height:var(--unit-size);min-width:0;width:100%}.tp-cctxtsv_i:hover,.tp-cswv_sw:hover,.tp-p2dpadv_p:hover,.tp-p2dtxtv_i:hover,.tp-p3dtxtv_i:hover,.tp-txtv_i:hover{background-color:var(--input-background-color-hover)}.tp-cctxtsv_i:focus,.tp-cswv_sw:focus,.tp-p2dpadv_p:focus,.tp-p2dtxtv_i:focus,.tp-p3dtxtv_i:focus,.tp-txtv_i:focus{background-color:var(--input-background-color-focus)}.tp-cctxtsv_i:active,.tp-cswv_sw:active,.tp-p2dpadv_p:active,.tp-p2dtxtv_i:active,.tp-p3dtxtv_i:active,.tp-txtv_i:active{background-color:var(--input-background-color-active)}.tp-grlv_g,.tp-sglv_i,.tp-mllv_i{background-color:var(--monitor-background-color);border-radius:2px;box-sizing:border-box;color:var(--monitor-foreground-color);height:var(--unit-size);width:100%}.tp-btnv{padding:0 4px}.tp-btnv_b{width:100%}.tp-ckbv_l{display:block;position:relative}.tp-ckbv_i{left:0;opacity:0;position:absolute;top:0}.tp-ckbv_m{background-color:var(--input-background-color);border-radius:2px;cursor:pointer;display:block;height:var(--unit-size);position:relative;width:var(--unit-size)}.tp-ckbv_m::before{background-color:var(--input-foreground-color);border-radius:2px;bottom:4px;content:\'\';display:block;left:4px;opacity:0;position:absolute;right:4px;top:4px}.tp-ckbv_i:hover+.tp-ckbv_m{background-color:var(--input-background-color-hover)}.tp-ckbv_i:focus+.tp-ckbv_m{background-color:var(--input-background-color-focus)}.tp-ckbv_i:active+.tp-ckbv_m{background-color:var(--input-background-color-active)}.tp-ckbv_i:checked+.tp-ckbv_m::before{opacity:1}.tp-cctxtsv{display:flex;width:100%}.tp-cctxtsv_m{margin-right:4px;position:relative}.tp-cctxtsv_ms{border-radius:2px;color:var(--label-foreground-color);cursor:pointer;height:var(--unit-size);line-height:var(--unit-size);padding:0 18px 0 4px}.tp-cctxtsv_ms:hover{background-color:var(--input-background-color-hover)}.tp-cctxtsv_ms:focus{background-color:var(--input-background-color-focus)}.tp-cctxtsv_ms:active{background-color:var(--input-background-color-active)}.tp-cctxtsv_mm{border-color:var(--label-foreground-color) transparent transparent;border-style:solid;border-width:3px;box-sizing:border-box;height:6px;pointer-events:none;width:6px;bottom:0;margin:auto;position:absolute;right:6px;top:3px}.tp-cctxtsv_w{display:flex;flex:1}.tp-cctxtsv_i{border-radius:0;flex:1;padding:0 4px}.tp-cctxtsv_i:first-child{border-bottom-left-radius:2px;border-top-left-radius:2px}.tp-cctxtsv_i:last-child{border-bottom-right-radius:2px;border-top-right-radius:2px}.tp-cctxtsv_i+.tp-cctxtsv_i{margin-left:2px}.tp-clpv{background-color:var(--base-background-color);border-radius:6px;box-shadow:0 2px 4px var(--base-shadow-color);display:none;padding:4px;position:relative;visibility:hidden;z-index:1000}.tp-clpv.tp-clpv-expanded{display:block;visibility:visible}.tp-clpv_h,.tp-clpv_ap{margin-left:6px;margin-right:6px}.tp-clpv_h{margin-top:4px}.tp-clpv_rgb{display:flex;margin-top:4px;width:100%}.tp-clpv_a{display:flex;margin-top:4px;padding-top:8px;position:relative}.tp-clpv_a:before{background-color:var(--separator-color);content:\'\';height:4px;left:-4px;position:absolute;right:-4px;top:0}.tp-clpv_ap{align-items:center;display:flex;flex:3}.tp-clpv_at{flex:1;margin-left:4px}.tp-svpv{border-radius:2px;outline:none;overflow:hidden;position:relative}.tp-svpv_c{cursor:crosshair;display:block;height:80px;width:100%}.tp-svpv_m{border-radius:100%;border:rgba(255,255,255,0.75) solid 2px;box-sizing:border-box;filter:drop-shadow(0 0 1px rgba(0,0,0,0.3));height:12px;margin-left:-6px;margin-top:-6px;pointer-events:none;position:absolute;width:12px}.tp-svpv:focus .tp-svpv_m{border-color:#fff}.tp-hplv{cursor:pointer;height:var(--unit-size);outline:none;position:relative}.tp-hplv_c{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAABCAYAAABubagXAAAAQ0lEQVQoU2P8z8Dwn0GCgQEDi2OK/RBgYHjBgIpfovFh8j8YBIgzFGQxuqEgPhaDOT5gOhPkdCxOZeBg+IDFZZiGAgCaSSMYtcRHLgAAAABJRU5ErkJggg==);background-position:left top;background-repeat:no-repeat;background-size:100% 100%;border-radius:2px;display:block;height:4px;left:0;margin-top:-2px;position:absolute;top:50%;width:100%}.tp-hplv_m{border-radius:2px;border:rgba(255,255,255,0.75) solid 2px;box-shadow:0 0 2px rgba(0,0,0,0.1);box-sizing:border-box;height:12px;left:50%;margin-left:-6px;margin-top:-6px;pointer-events:none;position:absolute;top:50%;width:12px}.tp-hplv:focus .tp-hplv_m{border-color:#fff}.tp-aplv{cursor:pointer;height:var(--unit-size);outline:none;position:relative;width:100%}.tp-aplv_b{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:4px 4px;background-position:0 0,2px 2px;border-radius:2px;display:block;height:4px;left:0;margin-top:-2px;overflow:hidden;position:absolute;top:50%;width:100%}.tp-aplv_c{bottom:0;left:0;position:absolute;right:0;top:0}.tp-aplv_m{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:12px 12px;background-position:0 0,6px 6px;border-radius:2px;box-shadow:0 0 2px rgba(0,0,0,0.1);height:12px;left:50%;margin-left:-6px;margin-top:-6px;overflow:hidden;pointer-events:none;position:absolute;top:50%;width:12px}.tp-aplv_p{border-radius:2px;border:rgba(255,255,255,0.75) solid 2px;box-sizing:border-box;bottom:0;left:0;position:absolute;right:0;top:0}.tp-aplv:focus .tp-aplv_p{border-color:#fff}.tp-cswv{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:10px 10px;background-position:0 0,5px 5px;border-radius:2px}.tp-cswv_b{-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:transparent;border-width:0;cursor:pointer;display:block;height:var(--unit-size);left:0;margin:0;outline:none;padding:0;position:absolute;top:0;width:var(--unit-size)}.tp-cswv_b:focus::after{border:rgba(255,255,255,0.75) solid 2px;border-radius:2px;bottom:0;content:\'\';display:block;left:0;position:absolute;right:0;top:0}.tp-cswv_p{left:-4px;position:absolute;right:-4px;top:var(--unit-size)}.tp-cswtxtv{display:flex;position:relative}.tp-cswtxtv_s{flex-grow:0;flex-shrink:0;width:var(--unit-size)}.tp-cswtxtv_t{flex:1;margin-left:4px}.tp-dfwv{position:absolute;top:8px;right:8px;width:256px}.tp-fldv.tp-fldv-expanded .tp-fldv_t{transition:border-radius 0s}.tp-fldv_c{border-left:var(--folder-background-color) solid 4px}.tp-fldv_t:hover+.tp-fldv_c{border-left-color:var(--folder-background-color-hover)}.tp-fldv_t:focus+.tp-fldv_c{border-left-color:var(--folder-background-color-focus)}.tp-fldv_t:active+.tp-fldv_c{border-left-color:var(--folder-background-color-active)}.tp-fldv_c>.tp-fldv{margin-left:4px}.tp-fldv_c>.tp-fldv>.tp-fldv_t{border-top-left-radius:2px;border-bottom-left-radius:2px}.tp-fldv_c>.tp-fldv.tp-fldv-expanded>.tp-fldv_t{border-bottom-left-radius:0}.tp-fldv_c .tp-fldv>.tp-fldv_c{border-bottom-left-radius:2px}.tp-grlv{position:relative}.tp-grlv_g{display:block;height:calc(var(--unit-size) * 3)}.tp-grlv_g polyline{fill:none;stroke:var(--monitor-foreground-color);stroke-linejoin:round}.tp-grlv_t{color:var(--monitor-foreground-color);font-size:0.9em;left:0;pointer-events:none;position:absolute;text-indent:4px;top:0;visibility:hidden}.tp-grlv_t.tp-grlv_t-valid{visibility:visible}.tp-grlv_t::before{background-color:var(--monitor-foreground-color);border-radius:100%;content:\'\';display:block;height:4px;left:-2px;position:absolute;top:-2px;width:4px}.tp-lblv{align-items:center;display:flex;line-height:1.3;padding-left:4px;padding-right:4px}.tp-lblv_l{color:var(--label-foreground-color);flex:1;-webkit-hyphens:auto;-ms-hyphens:auto;hyphens:auto;overflow:hidden;padding-left:4px;padding-right:16px}.tp-lblv_v{align-self:flex-start;flex-grow:0;flex-shrink:0;width:160px}.tp-lstv{position:relative}.tp-lstv_s{padding:0 18px 0 4px;width:100%}.tp-lstv_m{border-color:var(--button-foreground-color) transparent transparent;border-style:solid;border-width:3px;box-sizing:border-box;height:6px;pointer-events:none;width:6px;bottom:0;margin:auto;position:absolute;right:6px;top:3px}.tp-sglv_i{padding:0 4px}.tp-mllv_i{display:block;height:calc(var(--unit-size) * 3);line-height:var(--unit-size);padding:0 4px;resize:none;white-space:pre}.tp-p2dpadv{background-color:var(--base-background-color);border-radius:6px;box-shadow:0 2px 4px var(--base-shadow-color);display:none;padding:4px 4px 4px calc(4px * 2 + var(--unit-size));position:relative;visibility:hidden;z-index:1000}.tp-p2dpadv.tp-p2dpadv-expanded{display:block;visibility:visible}.tp-p2dpadv_p{cursor:crosshair;height:0;overflow:hidden;padding-bottom:100%;position:relative}.tp-p2dpadv_g{display:block;height:100%;left:0;pointer-events:none;position:absolute;top:0;width:100%}.tp-p2dpadv_ax{stroke:var(--input-guide-color)}.tp-p2dpadv_l{stroke:var(--input-foreground-color);stroke-linecap:round;stroke-dasharray:1px 3px}.tp-p2dpadv_m{fill:var(--input-foreground-color)}.tp-p2dpadtxtv{display:flex;position:relative}.tp-p2dpadtxtv_b{height:var(--unit-size);position:relative;width:var(--unit-size)}.tp-p2dpadtxtv_b svg{display:block;height:16px;left:50%;margin-left:-8px;margin-top:-8px;position:absolute;top:50%;width:16px}.tp-p2dpadtxtv_p{left:-4px;position:absolute;right:-4px;top:var(--unit-size)}.tp-p2dpadtxtv_t{margin-left:4px}.tp-p2dtxtv{display:flex}.tp-p2dtxtv_w{align-items:center;display:flex}.tp-p2dtxtv_w+.tp-p2dtxtv_w{margin-left:2px}.tp-p2dtxtv_i{padding:0 4px;width:100%}.tp-p2dtxtv_w:nth-child(1) .tp-p2dtxtv_i{border-top-right-radius:0;border-bottom-right-radius:0}.tp-p2dtxtv_w:nth-child(2) .tp-p2dtxtv_i{border-top-left-radius:0;border-bottom-left-radius:0}.tp-p3dtxtv{display:flex}.tp-p3dtxtv_w{align-items:center;display:flex}.tp-p3dtxtv_w+.tp-p3dtxtv_w{margin-left:2px}.tp-p3dtxtv_i{padding:0 4px;width:100%}.tp-p3dtxtv_w:first-child .tp-p3dtxtv_i{border-top-right-radius:0;border-bottom-right-radius:0}.tp-p3dtxtv_w:not(:first-child):not(:last-child) .tp-p3dtxtv_i{border-radius:0}.tp-p3dtxtv_w:last-child .tp-p3dtxtv_i{border-top-left-radius:0;border-bottom-left-radius:0}.tp-rotv{--font-family: var(--tp-font-family, Roboto Mono,Source Code Pro,Menlo,Courier,monospace);--unit-size: var(--tp-unit-size, 20px);--base-background-color: var(--tp-base-background-color, #2f3137);--base-shadow-color: var(--tp-base-shadow-color, rgba(0,0,0,0.2));--button-background-color: var(--tp-button-background-color, #adafb8);--button-background-color-active: var(--tp-button-background-color-active, #d6d7db);--button-background-color-focus: var(--tp-button-background-color-focus, #c8cad0);--button-background-color-hover: var(--tp-button-background-color-hover, #bbbcc4);--button-foreground-color: var(--tp-button-foreground-color, #2f3137);--folder-background-color: var(--tp-folder-background-color, rgba(200,202,208,0.1));--folder-background-color-active: var(--tp-folder-background-color-active, rgba(200,202,208,0.25));--folder-background-color-focus: var(--tp-folder-background-color-focus, rgba(200,202,208,0.2));--folder-background-color-hover: var(--tp-folder-background-color-hover, rgba(200,202,208,0.15));--folder-foreground-color: var(--tp-folder-foreground-color, #c8cad0);--input-background-color: var(--tp-input-background-color, rgba(200,202,208,0.1));--input-background-color-active: var(--tp-input-background-color-active, rgba(200,202,208,0.25));--input-background-color-focus: var(--tp-input-background-color-focus, rgba(200,202,208,0.2));--input-background-color-hover: var(--tp-input-background-color-hover, rgba(200,202,208,0.15));--input-foreground-color: var(--tp-input-foreground-color, #c8cad0);--input-guide-color: var(--tp-input-guide-color, rgba(47,49,55,0.5));--label-foreground-color: var(--tp-label-foreground-color, rgba(200,202,208,0.7));--monitor-background-color: var(--tp-monitor-background-color, #26272c);--monitor-foreground-color: var(--tp-monitor-foreground-color, rgba(200,202,208,0.7));--separator-color: var(--tp-separator-color, #26272c)}.tp-rotv{background-color:var(--base-background-color);border-radius:6px;box-shadow:0 2px 4px var(--base-shadow-color);font-family:var(--font-family);font-size:11px;font-weight:500;line-height:1;text-align:left}.tp-rotv_t{border-bottom-left-radius:6px;border-bottom-right-radius:6px;border-top-left-radius:6px;border-top-right-radius:6px}.tp-rotv.tp-rotv-expanded .tp-rotv_t{border-bottom-left-radius:0;border-bottom-right-radius:0}.tp-rotv_m{transition:none}.tp-rotv_c>.tp-fldv:last-child>.tp-fldv_c{border-bottom-left-radius:6px;border-bottom-right-radius:6px}.tp-rotv_c>.tp-fldv:last-child:not(.tp-fldv-expanded)>.tp-fldv_t{border-bottom-left-radius:6px;border-bottom-right-radius:6px}.tp-rotv_c>.tp-fldv:first-child>.tp-fldv_t{border-top-left-radius:6px;border-top-right-radius:6px}.tp-sptv_r{background-color:var(--separator-color);border-width:0;display:block;height:4px;margin:0;width:100%}.tp-sldv_o{box-sizing:border-box;cursor:pointer;height:var(--unit-size);margin:0 6px;outline:none;position:relative}.tp-sldv_o::before{background-color:var(--input-background-color);border-radius:1px;bottom:0;content:\'\';display:block;height:2px;left:0;margin:auto;position:absolute;right:0;top:0}.tp-sldv_i{height:100%;left:0;position:absolute;top:0}.tp-sldv_i::before{background-color:var(--button-background-color);border-radius:2px;bottom:0;content:\'\';display:block;height:12px;margin:auto;position:absolute;right:-6px;top:0;width:12px}.tp-sldv_o:hover .tp-sldv_i::before{background-color:var(--button-background-color-hover)}.tp-sldv_o:focus .tp-sldv_i::before{background-color:var(--button-background-color-focus)}.tp-sldv_o:active .tp-sldv_i::before{background-color:var(--button-background-color-active)}.tp-sldtxtv{display:flex}.tp-sldtxtv_s{flex:2}.tp-sldtxtv_t{flex:1;margin-left:4px}.tp-txtv_i{padding:0 4px}.tp-v-hidden{display:none}');
            getAllPlugins().forEach(function (plugin) {
                if (plugin.css) {
                    embedStyle(doc, "plugin-" + plugin.id, plugin.css);
                }
            });
        }
        var Tweakpane = /** @class */ (function (_super) {
            __extends(Tweakpane, _super);
            function Tweakpane(opt_config) {
                var _a;
                var _this = this;
                var config = opt_config || {};
                var doc = (_a = config.document) !== null && _a !== void 0 ? _a : getWindowDocument();
                var rootController = new RootController(doc, {
                    expanded: config.expanded,
                    blade: new Blade(),
                    title: config.title,
                });
                _this = _super.call(this, rootController) || this;
                _this.containerElem_ = config.container || createDefaultWrapperElement(doc);
                _this.containerElem_.appendChild(_this.element);
                _this.doc_ = doc;
                _this.usesDefaultWrapper_ = !config.container;
                embedDefaultStyleIfNeeded(_this.document);
                return _this;
            }
            Object.defineProperty(Tweakpane.prototype, "document", {
                get: function () {
                    if (!this.doc_) {
                        throw TpError.alreadyDisposed();
                    }
                    return this.doc_;
                },
                enumerable: false,
                configurable: true
            });
            Tweakpane.prototype.dispose = function () {
                var containerElem = this.containerElem_;
                if (!containerElem) {
                    throw TpError.alreadyDisposed();
                }
                if (this.usesDefaultWrapper_) {
                    var parentElem = containerElem.parentElement;
                    if (parentElem) {
                        parentElem.removeChild(containerElem);
                    }
                }
                this.containerElem_ = null;
                this.doc_ = null;
                _super.prototype.dispose.call(this);
            };
            return Tweakpane;
        }(RootApi));
        function registerDefaultPlugins() {
            [
                Point2dInputPlugin,
                Point3dInputPlugin,
                StringInputPlugin,
                NumberInputPlugin,
                StringColorInputPlugin,
                ObjectColorInputPlugin,
                NumberColorInputPlugin,
                BooleanInputPlugin,
            ].forEach(function (p) {
                RootApi.registerPlugin({
                    type: 'input',
                    plugin: p,
                });
            });
            [BooleanMonitorPlugin, StringMonitorPlugin, NumberMonitorPlugin].forEach(function (p) {
                RootApi.registerPlugin({
                    type: 'monitor',
                    plugin: p,
                });
            });
        }
        registerDefaultPlugins();

        return Tweakpane;

    })));
    }(tweakpane));

    var Tweakpane = tweakpane.exports;

    /**
     * 参照元のparametersを変更する
     * @param parameters
     * @param element
     */
    const addParameters = (parameters, element) => {
        const Pane = new Tweakpane({ container: element });
        // CULL_FACE
        if ('cullFace' in parameters) {
            Pane.addInput({ cullFace: parameters.cullFace }, 'cullFace').on('change', (v) => {
                parameters.cullFace = v;
            });
        }
        // DEPTH_TEST
        if ('depthTest' in parameters) {
            Pane.addInput({ depthTest: parameters.depthTest }, 'depthTest').on('change', (v) => {
                parameters.depthTest = v;
            });
        }
        // pMatrix
        if (parameters.view) {
            const viewOption = Pane.addFolder({ title: 'view', expanded: true });
            viewOption
                .addInput({ fovy: parameters.view.fovy }, 'fovy', {
                step: 0.1,
            })
                .on('change', (v) => {
                parameters.view.fovy = v;
            });
            viewOption
                .addInput({ near: parameters.view.near }, 'near', {
                step: 0.1,
            })
                .on('change', (v) => {
                parameters.view.near = v;
            });
            viewOption
                .addInput({ far: parameters.view.far }, 'far', {
                step: 0.1,
            })
                .on('change', (v) => {
                parameters.view.far = v;
            });
        }
        // light
        if (parameters.light) {
            const option = Pane.addFolder({ title: 'light', expanded: true });
            option
                .addInput({ position: parameters.light.position }, 'position', {
                x: { step: 0.1 },
                y: { step: 0.1 },
                z: { step: 0.1 },
            })
                .on('change', (v) => {
                parameters.light.position = v;
            });
        }
        // diffuseLight
        if (parameters.diffuseLight) {
            const option = Pane.addFolder({ title: 'diffuseLight', expanded: true });
            option.addInput({ enable: parameters.diffuseLight.enable }, 'enable').on('change', (v) => {
                parameters.diffuseLight.enable = v;
            });
        }
        // ambientLight
        if (parameters.ambientLight) {
            const option = Pane.addFolder({ title: 'ambientLight', expanded: true });
            option.addInput({ enable: parameters.ambientLight.enable }, 'enable').on('change', (v) => {
                parameters.ambientLight.enable = v;
            });
            option
                .addInput({ intensity: parameters.ambientLight.intensity }, 'intensity', {
                step: 0.1,
            })
                .on('change', (v) => {
                parameters.ambientLight.intensity = v;
            });
        }
        // specularLight
        if (parameters.specularLight) {
            const option = Pane.addFolder({ title: 'specularLight', expanded: true });
            option
                .addInput({ enable: parameters.specularLight.enable }, 'enable')
                .on('change', (v) => {
                parameters.specularLight.enable = v;
            });
            option
                .addInput({ shininess: parameters.specularLight.shininess }, 'shininess', {
                step: 0.1,
            })
                .on('change', (v) => {
                parameters.specularLight.shininess = v;
            });
        }
    };

    class Scene$1 {
        constructor() {
            this.program = null;
            this.pMatrix = create$3();
            this.vMatrix = create$3();
            this.vpMatrix = create$3();
            this.attLocation = [];
            this.attStride = [];
            this.uniLocation = uniLocation$1;
            this.parameters = {
                cullFace: false,
                depthTest: false,
                view: {
                    fovy: 45,
                    near: 0.0,
                    far: 20.0,
                },
            };
            this.targetPosition = [0.0, 3.0, 0.0];
            this.taxis = new g();
        }
        init(canvas, paneElement) {
            this.canvas = canvas;
            this.gl = canvas.getContext(`webgl`);
            this.camera = new Camera$1(canvas, {
                position: {
                    direction: [0.0, 1.0, 1.0],
                    distance: 10.0,
                },
            });
            addParameters(this.parameters, paneElement);
            this.addResizeEvent();
            this.setupProgram();
            // 個別の処理
            this.setupBoxGeometry();
            this.setupAxisGeometry();
            this.setupLocation();
            this.render();
        }
        /**
         * Stop ticker
         */
        destroy() {
            this.taxis.reset();
        }
        setupProgram() {
            const mainVs = createShaderObject(this.gl, vertex$1, this.gl.VERTEX_SHADER);
            const mainFs = createShaderObject(this.gl, fragment$1, this.gl.FRAGMENT_SHADER);
            this.program = createProgram(this.gl, mainVs, mainFs);
            this.gl.useProgram(this.program);
        }
        addResizeEvent() {
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas, { passive: true });
        }
        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        setupLocation() {
            attribute$1.forEach((v, i) => {
                this.attLocation[i] = this.gl.getAttribLocation(this.program, v.variable);
                this.attStride[i] = v.attStride;
            });
            Object.keys(this.uniLocation).forEach((uniform) => {
                this.uniLocation[uniform] = this.gl.getUniformLocation(this.program, uniform);
            });
        }
        setupRendering(delta) {
            // clear処理
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.gl.clearColor(0.1, 0.12, 0.14, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.reflectParameters();
            // 自作の
            invert(this.vMatrix, this.camera.update());
            perspective(this.pMatrix, this.parameters.view.fovy, this.canvas.width / this.canvas.height, this.parameters.view.near, this.parameters.view.far);
            multiply$1(this.vpMatrix, this.pMatrix, this.vMatrix);
        }
        setupBoxGeometry() {
            this.box = cubeWireframe(0.5, 0.5, 0.5, [1.0, 0.45, 0.45, 1.0]);
            this.boxVBO = [createVBO(this.gl, this.box.position), createVBO(this.gl, this.box.color)];
        }
        renderTargetBoxGeometry(position, delta) {
            enableAttribute(this.gl, this.boxVBO, this.attLocation, this.attStride);
            const x = Math.cos(delta / 1000) * 5;
            const z = Math.sin(delta / 1000) * 5;
            this.targetPosition[0] = x;
            this.targetPosition[2] = z;
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, this.targetPosition);
            this.setupMvp(mMatrix);
            this.gl.drawArrays(this.gl.LINES, 0, this.box.position.length / 3);
        }
        renderBoxGeometry(position) {
            enableAttribute(this.gl, this.boxVBO, this.attLocation, this.attStride);
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, position);
            targetTo(mMatrix, position, this.targetPosition, [0.0, 1.0, 0.0]);
            this.setupMvp(mMatrix);
            this.gl.drawArrays(this.gl.LINES, 0, this.box.position.length / 3);
        }
        setupAxisGeometry() {
            this.axis = axis(20 /*, [1.0, 0.45, 0.45, 1.0]*/);
            this.axisVBO = [createVBO(this.gl, this.axis.position), createVBO(this.gl, this.axis.color)];
        }
        renderAxis(position) {
            enableAttribute(this.gl, this.axisVBO, this.attLocation, this.attStride);
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, position);
            this.setupMvp(mMatrix);
            this.gl.drawArrays(this.gl.LINES, 0, this.axis.position.length / 3);
        }
        setupMvp(mMatrix) {
            // // mvp 行列を生成してシェーダに送る
            const mvpMatrix = create$3();
            multiply$1(mvpMatrix, this.vpMatrix, mMatrix);
            this.gl.uniformMatrix4fv(this.uniLocation.mvpMatrix, false, mvpMatrix);
        }
        /**
         * render処理
         */
        render() {
            this.taxis.begin();
            this.taxis.ticker((delta, axes) => {
                this.setupRendering(delta);
                // target
                this.renderTargetBoxGeometry([0.0, 3.0, 0.0], delta);
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        const x = (j - 5) * 1 + 0.5;
                        const z = (i - 5) * 1 + 0.5;
                        this.renderBoxGeometry([x, 0.0, z]);
                    }
                }
                this.renderAxis([0.0, 0.0, 0.0]);
            });
        }
        reflectParameters() {
            if (this.parameters.cullFace) {
                this.gl.enable(this.gl.CULL_FACE);
            }
            else {
                this.gl.disable(this.gl.CULL_FACE);
            }
            if (this.parameters.depthTest) {
                this.gl.enable(this.gl.DEPTH_TEST);
            }
            else {
                this.gl.disable(this.gl.DEPTH_TEST);
            }
        }
    }

    /* src/components/Camera/Camera.svelte generated by Svelte v3.42.5 */
    const file$2 = "src/components/Camera/Camera.svelte";

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
    			add_location(canvas, file$2, 13, 0, 284);
    			add_location(div0, file$2, 15, 2, 388);
    			attr_dev(div1, "class", "fixed right-8 top-8");
    			add_location(div1, file$2, 14, 0, 352);
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
    	validate_slots('Camera', slots, []);
    	let canvasElement;
    	let paneElement;
    	const scene = new Scene$1();

    	onMount(() => {
    		scene.init(canvasElement, paneElement);
    	});

    	onDestroy(() => {
    		scene.destroy();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Camera> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			paneElement = $$value;
    			$$invalidate(1, paneElement);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		Scene: Scene$1,
    		canvasElement,
    		paneElement,
    		scene
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('paneElement' in $$props) $$invalidate(1, paneElement = $$props.paneElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, paneElement, canvas_binding, div0_binding];
    }

    class Camera extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Camera",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    var fragment = "precision mediump float;\n\nuniform vec3 eyePosition;\nuniform vec3 lightDirection;\n\n// ambient light\nuniform float ambient;\n// uniform float ambientMaterial\n// uniform float ambientLight\nuniform bool enableAmbientLight;\n// diffuse light\n// uniform float diffuseMaterial\n// uniform float diffuseLight\n\n// specular light\n// uniform float specularMaterial\n// uniform float specularLight\nuniform bool enableSpecular;\nuniform float shininess;\n\n// Phong reflection model（フォンの反射モデル）\n//   === Ambient Reflection + Diffuse Reflection + Specular Reflection\n// Ambient Reflection（環境光反射）\n// Diffuse Reflection（拡散反射）\n// Specular Reflection（鏡面反射）\n//\n// ambientRefrlction =\n//   ambientMaterial（環境反射係数） *\n//   ambientLight（環境光成分）\n//\n// diffuseRefrlction =\n//   diffuseMaterial（拡散反射係数） *\n//   diffuseLight（拡散光成分） *\n//   0.0 ~ 1.0（入射角による因数）\n//\n// specularRefrlction =\n//   specularMaterial（鏡面反射係数） *\n//   specularLight（鏡面光成分） *\n//   0.0 ~ 1.0（反射ベクトルによる因数）\n\nvarying vec3 vPosition;\nvarying vec4 vColor;\nvarying vec3 vNormal;\n\n// TODO: lightのon/off制御\n// enableDirectionLight\n// uAmbientMaterial\n// uDiffuseMaterial\n// shininess\n\n\nvoid main(){\n    vec3 light = normalize(lightDirection);\n    // 念の為、単位化\n    vec3 normal = normalize(vNormal);\n\n    float diffuse = max(dot(light, normal), 0.0);\n\n    float ambientIntensity = enableAmbientLight ? ambient : 0.0;\n\n    // 拡散光と環境光の成分をグローバルカラーに適用しておく @@@\n    vec3 rgb = vColor.rgb * min(diffuse + ambientIntensity, 1.0);\n\n    // 視線ベクトルは、カメラの位置とワールド空間上の頂点の位置から求める @@@\n    vec3 eye = normalize(vPosition - eyePosition);\n\n    // 視線ベクトルと法線を使って、反射ベクトルを作る @@@\n    vec3 reflectVector = normalize(reflect(eye, normal));\n\n    // 反射ベクトルとライトベクトルの内積で反射光を計算する @@@\n    float specular = max(dot(reflectVector, light), 0.0);\n\n    // スペキュラ成分はべき算を用いて先鋭化する @@@\n    specular = pow(specular, shininess);\n\n    // フラグが経ってない場合無効化する @@@\n    specular = enableSpecular ? specular : 0.0;\n\n    // 反射光の成分は単純に加算して出力する @@@\n    gl_FragColor = vec4(rgb + specular, 1.0);\n\n//    gl_FragColor = vec4(rgb, 1.0);\n}\n\n";

    var vertex = "attribute vec3 position;\nattribute vec4 color;\nattribute vec3 normal;\nuniform mat4 mvpMatrix;\nuniform mat4 normalMatrix;\nvarying vec3 vPosition;\nvarying vec4 vColor;\nvarying vec3 vNormal;\n\n\nvoid main(){\n    vPosition = position;\n    vColor = color;\n    vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;\n\n    gl_Position = mvpMatrix * vec4(position, 1.0);\n}\n\n";

    const { attribute, uniform, uniLocation } = parseVariables({ vertex, fragment });

    class Scene {
        constructor() {
            this.program = null;
            this.pMatrix = create$3();
            this.vMatrix = create$3();
            this.vpMatrix = create$3();
            this.attLocation = [];
            this.attStride = [];
            this.uniLocation = uniLocation;
            this.parameters = {
                cullFace: true,
                depthTest: true,
                light: {
                    position: {
                        x: 1,
                        y: 1,
                        z: 1,
                    },
                },
                ambientLight: {
                    enable: true,
                    intensity: 0.2,
                },
                specularLight: {
                    enable: true,
                    shininess: 2.0
                },
            };
            this.box2 = {};
            this.targetPosition = [0.0, 3.0, 0.0];
            this.taxis = new g();
        }
        init(canvas, paneElement) {
            this.canvas = canvas;
            this.gl = canvas.getContext(`webgl`);
            this.camera = new Camera$1(canvas);
            addParameters(this.parameters, paneElement);
            this.addResizeEvent();
            this.setupProgram();
            // 個別の処理
            this.setupBoxGeometry();
            this.setupAxisGeometry();
            this.setupLocation();
            this.render();
        }
        /**
         * Stop ticker
         */
        destroy() {
            this.taxis.reset();
        }
        setupProgram() {
            const mainVs = createShaderObject(this.gl, vertex, this.gl.VERTEX_SHADER);
            const mainFs = createShaderObject(this.gl, fragment, this.gl.FRAGMENT_SHADER);
            this.program = createProgram(this.gl, mainVs, mainFs);
            this.gl.useProgram(this.program);
        }
        addResizeEvent() {
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas, { passive: true });
        }
        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        setupLocation() {
            attribute.forEach((v, i) => {
                this.attLocation[i] = this.gl.getAttribLocation(this.program, v.variable);
                this.attStride[i] = v.attStride;
            });
            Object.keys(this.uniLocation).forEach((uniform) => {
                this.uniLocation[uniform] = this.gl.getUniformLocation(this.program, uniform);
            });
        }
        setupRendering(delta) {
            // clear処理
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.gl.clearColor(0.1, 0.12, 0.14, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.reflectParameters();
            this.gl.uniform3fv(this.uniLocation.eyePosition, this.camera.position);
            this.gl.uniform3fv(this.uniLocation.lightDirection, [
                this.parameters.light.position.x,
                this.parameters.light.position.y,
                this.parameters.light.position.z,
            ]);
            this.gl.uniform1f(this.uniLocation.ambient, this.parameters.ambientLight.intensity);
            this.gl.uniform1i(this.uniLocation.enableSpecular, this.parameters.specularLight.enable);
            this.gl.uniform1f(this.uniLocation.shininess, this.parameters.specularLight.shininess);
            this.gl.uniform1i(this.uniLocation.enableAmbientLight, this.parameters.ambientLight.enable);
            // 自作の
            invert(this.vMatrix, this.camera.update());
            perspective(this.pMatrix, 45, this.canvas.width / this.canvas.height, 0.1, 20.0);
            multiply$1(this.vpMatrix, this.pMatrix, this.vMatrix);
        }
        setupBoxGeometry() {
            this.box = cube(1, [1.0, 0.45, 0.45, 1.0]);
            this.boxVBO = [
                createVBO(this.gl, this.box.position),
                createVBO(this.gl, this.box.color),
                createVBO(this.gl, this.box.normal),
            ];
            this.boxIBO = createIBO(this.gl, this.box.index);
            this.box2.geometry = cube(1, [1.0, 0.45, 0.45, 1.0]);
            this.box2.VBO = [
                createVBO(this.gl, this.box2.geometry.position),
                createVBO(this.gl, this.box2.geometry.color),
                createVBO(this.gl, this.box2.geometry.normal),
            ];
            this.box2.IBO = createIBO(this.gl, this.box2.geometry.index);
        }
        renderBoxGeometry(position, delta) {
            enableAttribute(this.gl, this.boxVBO, this.attLocation, this.attStride);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.boxIBO);
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, position);
            // mat4.rotate(mMatrix, mMatrix, delta / 1000, [1.0, 1.0, 1.0]);
            this.setupMvp(mMatrix);
            this.gl.drawElements(this.gl.TRIANGLES, this.box.index.length, this.gl.UNSIGNED_SHORT, 0);
        }
        renderBox2Geometry(position, delta) {
            enableAttribute(this.gl, this.box2.VBO, this.attLocation, this.attStride);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.box2.IBO);
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, position);
            // mat4.rotate(mMatrix, mMatrix, delta / 1000, [1.0, 1.0, 1.0]);
            this.setupMvp(mMatrix);
            this.gl.drawElements(this.gl.TRIANGLES, this.box2.geometry.index.length, this.gl.UNSIGNED_SHORT, 0);
        }
        setupAxisGeometry() {
            this.axis = axis(20 /*[0.45, 0.45, 0.45, 1.0]*/);
            this.axisVBO = [createVBO(this.gl, this.axis.position), createVBO(this.gl, this.axis.color)];
        }
        renderAxis(position) {
            enableAttribute(this.gl, this.axisVBO, this.attLocation, this.attStride);
            let mMatrix = create$3();
            translate(mMatrix, mMatrix, position);
            this.setupMvp(mMatrix);
            this.gl.drawArrays(this.gl.LINES, 0, this.axis.position.length / 3);
        }
        setupMvp(mMatrix) {
            // // normalMatrix
            const normalMatrix = create$3();
            invert(normalMatrix, mMatrix);
            transpose(normalMatrix, normalMatrix);
            this.gl.uniformMatrix4fv(this.uniLocation.normalMatrix, false, normalMatrix);
            // // mvp 行列を生成してシェーダに送る
            const mvpMatrix = create$3();
            multiply$1(mvpMatrix, this.vpMatrix, mMatrix);
            this.gl.uniformMatrix4fv(this.uniLocation.mvpMatrix, false, mvpMatrix);
        }
        /**
         * render処理
         */
        render() {
            this.taxis.begin();
            this.taxis.ticker((delta, axes) => {
                this.setupRendering(delta);
                this.renderBoxGeometry([-1.0, 0.0, 0.0], delta);
                this.renderBox2Geometry([1.0, 0.0, 0.0], delta);
                this.renderAxis([0.0, 0.0, 0.0]);
            });
        }
        reflectParameters() {
            if (this.parameters.cullFace) {
                this.gl.enable(this.gl.CULL_FACE);
            }
            else {
                this.gl.disable(this.gl.CULL_FACE);
            }
            if (this.parameters.depthTest) {
                this.gl.enable(this.gl.DEPTH_TEST);
            }
            else {
                this.gl.disable(this.gl.DEPTH_TEST);
            }
        }
    }

    /* src/components/Light/Light.svelte generated by Svelte v3.42.5 */
    const file$1 = "src/components/Light/Light.svelte";

    function create_fragment$1(ctx) {
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
    			add_location(canvas, file$1, 14, 0, 326);
    			add_location(div0, file$1, 16, 2, 430);
    			attr_dev(div1, "class", "fixed right-8 top-8");
    			add_location(div1, file$1, 15, 0, 394);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Light', slots, []);
    	let canvasElement;
    	let paneElement;
    	const scene = new Scene();

    	onMount(() => {
    		// setup(canvasElement, paneElement);
    		scene.init(canvasElement, paneElement);
    	});

    	onDestroy(() => {
    		scene.destroy();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Light> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			paneElement = $$value;
    			$$invalidate(1, paneElement);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		Scene,
    		canvasElement,
    		paneElement,
    		scene
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('paneElement' in $$props) $$invalidate(1, paneElement = $$props.paneElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, paneElement, canvas_binding, div0_binding];
    }

    class Light extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Light",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    // @see https://svelte.dev/repl/5abaac000b164aa1aacc6051d5c4f584?version=3.38.2
    const href = writable(window.location.href);
    const URL = window.URL;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const updateHref = () => href.set(window.location.href);
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        updateHref();
    };
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        updateHref();
    };
    window.addEventListener('popstate', updateHref);
    window.addEventListener('hashchange', updateHref);
    var url = {
        subscribe: derived(href, ($href) => new URL($href)).subscribe,
        ssrSet: (urlHref) => href.set(urlHref),
    };

    /* src/App.svelte generated by Svelte v3.42.5 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (20:2) {#if !$url.hash}
    function create_if_block_1(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let each_value = /*pageList*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "grid grid-cols-1 gap-4 sm:grid-cols-2");
    			add_location(div0, file, 22, 8, 589);
    			attr_dev(div1, "class", "max-w-3xl mx-auto");
    			add_location(div1, file, 21, 6, 549);
    			attr_dev(div2, "class", "max-w-7xl mx-auto p-8");
    			add_location(div2, file, 20, 4, 507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pageList*/ 4) {
    				each_value = /*pageList*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(20:2) {#if !$url.hash}",
    		ctx
    	});

    	return block;
    }

    // (31:18) {#if page.description}
    function create_if_block_2(ctx) {
    	let p;
    	let t_value = /*page*/ ctx[3].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "text-sm text-gray-500 truncate");
    			add_location(p, file, 31, 20, 1248);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(31:18) {#if page.description}",
    		ctx
    	});

    	return block;
    }

    // (24:10) {#each pageList as page, i}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let a;
    	let span0;
    	let t0;
    	let span1;
    	let t1_value = /*page*/ ctx[3].hash + "";
    	let t1;
    	let t2;
    	let t3;
    	let if_block = /*page*/ ctx[3].description && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			attr_dev(span0, "class", "absolute inset-0");
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file, 28, 18, 1044);
    			attr_dev(span1, "class", "text-sm font-medium text-gray-900");
    			add_location(span1, file, 29, 18, 1120);
    			attr_dev(a, "href", /*page*/ ctx[3].hash);
    			attr_dev(a, "class", "focus:outline-none");
    			add_location(a, file, 27, 16, 976);
    			attr_dev(div0, "class", "flex-1 min-w-0");
    			add_location(div0, file, 26, 14, 931);
    			attr_dev(div1, "class", "relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500");
    			add_location(div1, file, 24, 12, 691);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(a, span0);
    			append_dev(a, t0);
    			append_dev(a, span1);
    			append_dev(span1, t1);
    			append_dev(a, t2);
    			if (if_block) if_block.m(a, null);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (/*page*/ ctx[3].description) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:10) {#each pageList as page, i}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {#if !!$url.hash}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*pages*/ ctx[1][/*$url*/ ctx[0].hash.replace('#', '')].component;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*pages*/ ctx[1][/*$url*/ ctx[0].hash.replace('#', '')].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:2) {#if !!$url.hash}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = !/*$url*/ ctx[0].hash && create_if_block_1(ctx);
    	let if_block1 = !!/*$url*/ ctx[0].hash && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "w-full h-full");
    			add_location(main, file, 18, 0, 455);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*$url*/ ctx[0].hash) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!!/*$url*/ ctx[0].hash) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$url*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	let $url;
    	validate_store(url, 'url');
    	component_subscribe($$self, url, $$value => $$invalidate(0, $url = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const pages = {
    		camera: {
    			hash: '#camera',
    			component: Camera,
    			description: 'OrbitControls'
    		},
    		light: {
    			hash: '#light',
    			component: Light,
    			description: 'Phong reflection model'
    		}
    	};

    	const pageList = Object.values(pages);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Camera,
    		Light,
    		url,
    		pages,
    		pageList,
    		$url
    	});

    	return [$url, pages, pageList];
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
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
