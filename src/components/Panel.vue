<template>
    <div class="fixed m-5" style="width: 95.5%">
        <div class="flex justify-center">
            <color-picker class="bg-transparent z-20 m-5" v-bind="color" @input="setColor"></color-picker>
        </div>
        <hr class="my-20" />
        <div class="flex justify-center">
            <div
                @click="togglePower()"
                class="rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 p-5 mr-10"
            >
                <div
                    class="w-full h-full p-16 rounded-lg"
                    :class="{ 'bg-gray-500': status.on_off }"
                >Power {{ status.on_off ? 'Off' : 'On' }}</div>
            </div>
            <div
                @click="toggleCycle()"
                class="rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 p-5 mr-10"
            >
                <div
                    class="w-full h-full p-16 rounded-lg"
                    :class="{ cycle: status.cycle }"
                    :style="{ 'background-color': status.cycle ? `hsl(${this.color.hue}, 100%, 50%` : ''}"
                >Cycle {{ status.cycle ? 'Off' : 'On' }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import ColorPicker from "@radial-color-picker/vue-color-picker";
import { Tween, autoPlay } from "es6-tween";
autoPlay(true);

export default {
    components: { ColorPicker },
    data() {
        return {
            ws: { readyState: 3 },
            color: {
                hue: 50,
                saturation: 100,
                luminosity: 50,
                alpha: 1
            },
            canUpdate: true,
            status: {
                on_off: 0,
                mode: "normal",
                hue: 0,
                tweenedHue: 0,
                saturation: 0,
                color_temp: 0,
                brightness: 0,
                err_code: 0,
                cycle: false
            }
        };
    },
    watch: {
        "status.hue"(value, old) {
            if (!this.canUpdate || this.$children[0].isDragging) return;

            old = this.color.hue;

            if (old > value && old - value > 180) old -= 360;
            if (value > old && value - old > 180) old += 360;

            new Tween({ x: old })
                .to({ x: value }, 2200)
                .on("update", ({ x }) => {
                    this.color.hue = x;
                })
                .start();
        }
    },
    methods: {
        throttle(func, wait, options) {
            var context, args, result;
            var timeout = null;
            var previous = 0;
            if (!options) options = {};
            var later = function() {
                previous = options.leading === false ? 0 : Date.now();
                timeout = null;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            };
            return function() {
                var now = Date.now();
                if (!previous && options.leading === false) previous = now;
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0 || remaining > wait) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                } else if (!timeout && options.trailing !== false) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        setColor(input) {
            let hue = Math.round(input);
            this.color.hue = hue;
            this.postColor();
        },
        togglePower() {
            this.ws.send(JSON.stringify({ power: !this.status.on_off }));
        },
        toggleCycle() {
            this.ws.send(JSON.stringify({ cycle: !this.status.cycle }));
        },
        open(event) {
            console.log("Connected to " + this.address);
            this.cd = 1;

            this.pause = false;
        },
        connect() {
            console.log("Connecting to " + this.address);
            this.ws = null;
            this.ws = new WebSocket("ws://satelite:1728");

            this.ws.addEventListener("open", this.open);
            this.ws.addEventListener("message", this.message);
            this.ws.addEventListener("close", this.close);
            this.ws.addEventListener("error", this.error);

            this.pause = true;
        },
        message(event) {
            this.active = true;

            let parsed = JSON.parse(event.data);
            if (!parsed) return;

            this.status = parsed;
        },
        close(event) {
            console.log("Disconnected from " + this.address);

            this.pause = true;
        },
        error(event) {
            console.log("Error from " + this.address);
        }
    },
    created() {
        this.connect();
        this.reconnectInterval = setInterval(() => {
            if (this.ws.readyState != 3) return;
            this.connect();
        }, 1000);
        this.deadInterval = setInterval(() => {
            if (!this.active && this.ws.readyState != 0) this.ws.close();
            this.active = false;
        }, 5000);

        this.postColor = this.throttle(() => {
            this.ws.send(JSON.stringify({ color: this.color.hue }));

            this.canUpdate = false;
            setTimeout(() => void (this.canUpdate = true), 2500);
        }, 500);
    },
    beforeDestroy() {
        clearInterval(this.statusInterval);
        clearInterval(this.reconnectInterval);
        clearInterval(this.deadInterval);
        this.ws.close();
    }
};
</script>

<style>
@import "~@radial-color-picker/vue-color-picker/dist/vue-color-picker.min.css";

html {
    box-sizing: border-box;
}
*,
*:before,
*:after {
    box-sizing: inherit;
}

.rcp__palette:before {
    background-color: black;
}
</style>