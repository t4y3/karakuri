// // 直列
// taxis.add('pointsMove', 3 * 1000)
//   .add('pointsMove', 3 * 1000);
// taxis.all[
//   add('pointsMove', 3 * 1000),
//   add('pointsMove', 3 * 1000)
// ]

import { TaxisTimeline } from './components/timeline';

export type Axis = {
  key: string;
  beginAt: number;
  endAt?: number;
  progress: number; // 0 ~ 1
  enter: boolean; //
  pass: boolean; //
  tick: number; //
};

const initialAxis: Axis = {
  key: '',
  beginAt: 0,
  endAt: 0,
  progress: 0,
  enter: false,
  pass: false,
  tick: 0,
};

// type AxisExtend = Axis & {
//
// };

const Events = {
  ENTER: 'enter',
  LEAVE: 'leave',
  PASS: 'pass',
} as const;

type EventName = typeof Events[keyof typeof Events];

export class Taxis {
  private __axes: Axis[];
  private __beginAt: number;
  private requestID: number;

  __handlers: {
    string?: VoidFunction[];
  };
  __ticker: (delta: number, axis: Axis[]) => void;
  __timeline: any;

  __entered: Axis[];
  __left: Axis[];

  get totalTime() {
    return Math.max(...this.__axes.map((item) => item.endAt));
  }

  get everyPassed() {
    return this.__axes.every((item) => item.pass);
  }

  constructor() {
    this.__axes = [];
    this.__handlers = {};
  }

  restart() {
    this.__beginAt = Date.now();
  }

  /**
   * @param key
   */
  getAxis({ key }) {
    return this.__axes.find((item) => item.key === key);
  }

  /**
   *
   */
  getAxes() {
    return this.__axes;
  }

  entered(key: string) {
    return !!this.__entered.find((item) => item.key === key);
  }

  left(key: string) {
    return !!this.__left.find((item) => item.key === key);
  }

  /**
   * @param key
   * @param duration
   * @param beginAt
   */
  insert(key: string, duration: number, beginAt: number = 0) {
    this.__axes.push({
      ...initialAxis,
      key,
      beginAt,
      endAt: beginAt + duration,
    });

    // beginAtの昇順
    this.__axes.sort((a, b) => {
      return a.beginAt - b.beginAt;
    });

    return this;
  }

  interval(duration: number) {
    const lastAxis = this.__axes[this.__axes.length - 1];
    const beginAt = lastAxis.endAt;
    this.__axes.push({
      ...initialAxis,
      key: null,
      beginAt,
      endAt: beginAt + duration,
    });

    return this;
  }

  /**
   * @param key
   * @param duration
   * @param delay
   */
  append(key: string, duration: number, delay: number = 0) {
    const lastAxis = this.__axes[this.__axes.length - 1];
    const beginAt = lastAxis.endAt + delay;
    this.__axes.push({
      ...initialAxis,
      key,
      beginAt,
      endAt: beginAt + duration,
    });

    return this;
  }

  parallel() {}

  /**
   *
   */
  begin() {
    // TODO: 削除 timeline
    this.__timeline = new TaxisTimeline(this.__axes, this.totalTime);
    const element = document.querySelector('#timeline');
    element.appendChild(this.__timeline);

    this.__beginAt = Date.now();
    this.__tick();
  }

  /**
   * @param key
   * @param fn
   */
  on(key: EventName, fn: VoidFunction) {
    const functions = this.__handlers[key];
    if (!functions) {
      this.__handlers[key] = [];
    }
    this.__handlers[key].push(fn);
  }

  reset() {
    cancelAnimationFrame(this.requestID);
  }

  ticker(fn: (delta: number, axis: Axis[]) => void) {
    this.__ticker = fn;
  }

  /**
   * @private
   */
  private __tick() {
    // TODO: ここを変える

    const { beginAt, elapsedTime, dragging } = this.__timeline.get(this.__beginAt);

    this.__beginAt = beginAt;
    const enterEvents = [];
    const leaveEvents = [];
    const passEvents = [];
    this.__entered = [];
    this.__left = [];

    this.__axes.forEach((item, i) => {
      const tick = elapsedTime - item.beginAt;
      // TODO: addの時に計算する
      const duration = item.endAt - item.beginAt;
      const progress = Math.max(0, Math.min(tick / duration, 1));

      const enter = item.beginAt <= elapsedTime;
      const pass = item.endAt < elapsedTime;

      // TODO: イベント発火
      if (pass && !item.pass) {
        passEvents.push(item.key);
      }
      if (enter && !item.enter) {
        enterEvents.push(item.key);

        this.__entered.push(item);
      }
      if (progress === 0 && 0 < item.progress) {
        leaveEvents.push(item.key);

        this.__left.push(item);
      }
      item.progress = progress;
      item.enter = enter;
      item.pass = pass;
      item.tick = tick;
    });

    // fn
    if (passEvents.length) {
      (this.__handlers[Events.PASS] || []).forEach((fn) => {
        fn({
          events: passEvents,
        });
      });
    }
    if (enterEvents.length) {
      (this.__handlers[Events.ENTER] || []).forEach((fn) => {
        fn({
          events: enterEvents,
        });
      });
    }
    if (leaveEvents.length) {
      (this.__handlers[Events.LEAVE] || []).forEach((fn) => {
        fn({
          events: leaveEvents,
        });
      });
    }

    // TODO: 変える
    if (!dragging) {
      this.__timeline.update(elapsedTime, this.totalTime, this.__axes);
    }
    this.__ticker && this.__ticker(elapsedTime, this.__axes);

    this.requestID = requestAnimationFrame(this.__tick.bind(this));
  }
}
