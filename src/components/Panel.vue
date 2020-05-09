<template>
    <div class="fixed mt-8" style="width: 95.5%">
        <div class="flex">
            <div class="w-1/3 relative">
                <div class="font-mono text-4xl text-center">Light Controls</div>
                <hr class="my-3 mx-6" />
                <img src="/logo.svg" class="h-24 mt-16 mx-auto" />
                <div class="mx-auto font-mono text-center absolute bottom-0 w-full">{{ wsStatus }}</div>
            </div>
            <div class="w-2/3 pl-16">
                <div class="flex justify-center px-4">
                    <div class="w-1/2">
                        <Wheel class :cycle="status.cycle" :hue="hue" @update:hue="setHue($event)" />
                    </div>
                    <div class="w-1/2 flex justify-between pl-12">
                        <div class="linear-dial brightness" ref="brightness">
                            <div
                                class="picker"
                                :style="{ 'margin-top': `${(100 - brightness) * 2.71}px`, transition: clicked.brightness ? '' : 'all 1s ease-in-out 0s' }"
                            ></div>
                        </div>
                        <div class="linear-dial white" ref="white">
                            <div
                                class="picker"
                                :style="{ 'margin-top': `${(white - 2500) / 24 }px`, transition: clicked.white ? '' : 'all 1s ease-in-out 0s' }"
                            ></div>
                        </div>
                    </div>
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
                            style="transition: all 1s linear"
                        >
                            <div
                                :class="{ 'text-loading': clicked.power }"
                            >Power {{ status.on_off ? 'Off' : 'On' }}</div>
                            <div v-if="clicked.power" class="loading"></div>
                        </div>
                    </div>
                    <div
                        @click="toggleCycle()"
                        class="rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 p-5"
                    >
                        <div
                            class="w-full h-full p-16 rounded-lg"
                            :class="{ cycle: status.cycle }"
                            :style="{ 'background-color': status.cycle ? `hsl(${hue}, 100%, 50%` : '', transition: status.cycle ? 'all linear 3s' : 'all ease-in-out 1s' }"
                        >
                            <div
                                :class="{ 'text-loading': clicked.cycle }"
                            >Cycle {{ status.cycle ? 'Off' : 'On' }}</div>
                            <div v-if="clicked.cycle" class="loading"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Wheel from './ColorWheel';
import { Tween, autoPlay } from 'es6-tween';
autoPlay(true);

export default {
    components: { Wheel },
    data() {
        return {
            ws: { readyState: 3 },
            wsStatus: 'Connecting...',
            hue: 0,
            brightness: 0,
            white: 0,
            status: {
                on_off: 0,
                mode: 'normal',
                hue: 0,
                tweenedHue: 0,
                saturation: 0,
                color_temp: 0,
                brightness: 0,
                err_code: 0,
                cycle: false
            },
            clicked: {
                power: false,
                cycle: false,
                brightness: false,
                white: false
            },
            canUpdate: {
                power: true,
                cycle: true,
                hue: true,
                brightness: true,
                white: true
            }
        };
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
        togglePower() {
            this.ws.send(JSON.stringify({ power: !this.status.on_off }));
            this.clicked.power = true;
        },
        toggleCycle() {
            this.ws.send(JSON.stringify({ cycle: !this.status.cycle }));
            this.clicked.cycle = true;
        },
        open(event) {
            this.wsStatus = 'WebSocket Connected';
            console.log('Connected to ' + process.env.VUE_APP_WS_URL);
            this.cd = 1;

            this.pause = false;
        },
        connect() {
            console.log('Connecting to ' + process.env.VUE_APP_WS_URL);
            this.wsStatus = 'Connecting...';
            this.ws = null;
            this.ws = new WebSocket(process.env.VUE_APP_WS_URL);

            this.ws.addEventListener('open', this.open);
            this.ws.addEventListener('message', this.message);
            this.ws.addEventListener('close', this.close);
            this.ws.addEventListener('error', this.error);

            this.pause = true;
        },
        message(event) {
            this.active = true;

            const parsed = JSON.parse(event.data);
            if (!parsed) return;

            this.status = parsed;
            this.hue = parsed.hue;

            if (this.canUpdate.brightness) this.brightness = parsed.brightness;
            if (this.canUpdate.white) this.white = parsed.color_temp;

            this.clicked.power = false;
            this.clicked.cycle = false;
        },
        close(event) {
            console.log('Disconnected from ' + this.address);

            this.pause = true;
        },
        error(event) {
            console.log('Error from ' + this.address);
        },
        setHue(input) {
            const hue = Math.round(input);
            this.hue = hue;
            this.postColor();
        },
        brightnessClick(event) {
            this.clicked.brightness = true;
            this.brightnessAdjust(event);

            this.canUpdate.brightness = false;
            clearTimeout(this.brightnessTimeout);
        },
        brightnessUnClick() {
            this.clicked.brightness = false;

            this.brightnessTimeout = setTimeout(
                () => (this.canUpdate.brightness = true),
                1000
            );
        },
        brightnessAdjust(event) {
            if (!this.clicked.brightness) return;

            const point = event.targetTouches ? event.targetTouches[0] : event;
            const box = this.$refs.brightness.getBoundingClientRect();

            let percent = (point.clientY - box.top) / box.height;
            if (percent < 0) percent = 0;
            if (percent > 1) percent = 1;

            this.brightness = 100 - percent * 100;

            this.postBrightness();
        },
        whiteClick(event) {
            this.clicked.white = true;
            this.whiteAdjust(event);

            this.canUpdate.white = false;
            clearTimeout(this.whiteTimeout);
        },
        whiteUnClick() {
            this.clicked.white = false;

            this.whiteTimeout = setTimeout(
                () => (this.canUpdate.white = true),
                1000
            );
        },
        whiteAdjust(event) {
            if (!this.clicked.white) return;

            const point = event.targetTouches ? event.targetTouches[0] : event;
            const box = this.$refs.white.getBoundingClientRect();

            let percent = (point.clientY - box.top) / box.height;
            if (percent < 0) percent = 0;
            if (percent > 1) percent = 1;

            this.white = percent * 6500 + 2500;

            this.postWhite();
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
            this.ws.send(JSON.stringify({ color: this.hue }));
        }, 500);

        this.postBrightness = this.throttle(() => {
            this.ws.send(
                JSON.stringify({ brightness: Math.round(this.brightness) })
            );
        }, 500);

        this.postWhite = this.throttle(() => {
            this.ws.send(JSON.stringify({ white: Math.round(this.white) }));
        }, 500);
    },
    mounted() {
        this.$refs.brightness.addEventListener(
            'mousedown',
            this.brightnessClick,
            {
                passive: true
            }
        );
        document.addEventListener('mouseup', this.brightnessUnClick, {
            passive: true
        });
        document.addEventListener('mousemove', this.brightnessAdjust, {
            passive: false
        });
        document.addEventListener('mouseleave', this.brightnessUnClick, {
            passive: true
        });
        this.$refs.brightness.addEventListener(
            'touchstart',
            this.brightnessClick,
            { passive: true }
        );
        document.addEventListener('touchend', this.brightnessUnClick, {
            passive: true
        });
        document.addEventListener('touchmove', this.brightnessAdjust, {
            passive: false
        });
        document.addEventListener('touchcancel', this.brightnessUnClick, {
            passive: true
        });

        this.$refs.white.addEventListener('mousedown', this.whiteClick, {
            passive: true
        });
        document.addEventListener('mouseup', this.whiteUnClick, {
            passive: true
        });
        document.addEventListener('mousemove', this.whiteAdjust, {
            passive: false
        });
        document.addEventListener('mouseleave', this.whiteUnClick, {
            passive: true
        });
        this.$refs.white.addEventListener('touchstart', this.whiteClick, {
            passive: true
        });
        document.addEventListener('touchend', this.whiteUnClick, {
            passive: true
        });
        document.addEventListener('touchmove', this.whiteAdjust, {
            passive: false
        });
        document.addEventListener('touchcancel', this.whiteUnClick, {
            passive: true
        });
    },
    beforeDestroy() {
        clearInterval(this.statusInterval);
        clearInterval(this.reconnectInterval);
        clearInterval(this.deadInterval);
        this.ws.close();
        this.$refs.brightness.addEventListener(
            'mousedown',
            this.brightnessClick,
            {
                passive: true
            }
        );
        document.removeEventListener('mouseup', this.brightnessUnClick);
        document.removeEventListener('mousemove', this.brightnessAdjust);
        document.removeEventListener('mouseleave', this.brightnessUnClick);
        this.$refs.brightness.removeEventListener(
            'touchstart',
            this.brightnessClick
        );
        document.removeEventListener('tochend', this.brightnessUnClick);
        document.removeEventListener('touchmove', this.brightnessAdjust);
        document.removeEventListener('touchcancel', this.brightnessUnClick);

        this.$refs.white.removeEventListener('mousedown', this.whiteClick);
        document.removeEventListener('mouseup', this.whiteUnClick);
        document.removeEventListener('mousemove', this.whiteAdjust);
        document.removeEventListener('mouseleave', this.whiteUnClick);
        this.$refs.white.removeEventListener('touchstart', this.whiteClick);
        document.removeEventListener('tochend', this.whiteUnClick);
        document.removeEventListener('touchmove', this.whiteAdjust);
        document.removeEventListener('touchcancel', this.whiteUnClick);
    }
};
</script>

<style scoped>
.linear-dial {
    border-radius: 30px;
    border-width: 10px;
    border-color: #2d3748;
    height: 300px;
    width: 100px;
}
.white {
    /* margin-left: 250px; */
    background: linear-gradient(#ffb459, #b6ceff);
}
.brightness {
    /* margin-right: 250px; */
    background: linear-gradient(white, #414141);
}
.picker {
    height: 10px;
    width: 100px;
    margin-top: 50px;
    background-color: rgb(235, 235, 235);
    border-radius: 5px;
    border-bottom-width: 1px;
    border-color: #414141;
}
.loading {
    border-radius: 50%;
    border-color: rgba(0, 0, 0, 0);
    border-left-color: white;
    border-width: 5px;
    margin: -15px auto -15px auto;
    height: 50px;
    width: 50px;
    animation: spin 0.5s linear infinite;
}
.text-loading {
    color: rgba(0, 0, 0, 0);
    line-height: 0px;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>