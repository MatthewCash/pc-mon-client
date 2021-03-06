<template>
    <div>
        <div
            v-if="ws.readyState != 1"
            class="fixed h-screen w-screen"
            :class="[cd === 0 ? 'connecting' : 'disconnected']"
        >
            <div class="center">{{ cd === 0 ? 'CONNECTING' : 'DISCONNECTED' }}</div>
        </div>
        <div class="flex max-h-screen">
            <div class="w-2/4">
                <div>
                    <MemUsage :pause="pause" :usage="memory.usage" :max="memory.max" />
                </div>
                <div class="p-12" style="height: 50%">
                    <div class="bg-gray-900 h-full p-4 font-mono">
                        <div class="text-center sysinfo">System Information</div>
                        <hr class="my-3 border border-gray-700" />
                        <div>
                            <span class="font-bold">MEMORY:</span>
                            {{ Math.floor((memory.tweenedUsage / memory.max) * 100) }}%
                            | {{ Math.round(memory.tweenedUsage / 1000000) }}M /
                            {{ Math.round(memory.max / 1000000) }}M
                        </div>
                        <div>
                            <span class="font-bold">CPU:</span>
                            {{ Math.floor(cpu.tweenedUsage) }}%
                            <small>Total</small>
                        </div>
                        <div>
                            <span class="font-bold">NETWORK:</span>
                            {{ network.tx }}B
                            <small>Sent</small>
                            {{ network.rx }}B
                            <small>Received</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="w-2/4 flex flex-wrap flex-col cpu">
                <CPU
                    class="flex-shrink w-1/4"
                    v-for="(core, index) in cpu.cores"
                    :key="index"
                    :pause="pause"
                    :system="core.load_system"
                    :user="core.load_user"
                />
            </div>
        </div>
    </div>
</template>

<script>
import MemUsage from "./charts/MemUsage.vue";
import CPU from "./charts/CPU.vue";
import { Tween, autoPlay } from "es6-tween";
autoPlay(true);

export default {
    components: {
        MemUsage,
        CPU
    },
    props: ["address", "secure"],
    data() {
        return {
            ws: { readyState: 3 },
            active: false,
            cd: 0,
            pause: true,
            chartData: {
                labels: [],
                datasets: [{ label: "Used", data: [] }]
            },
            staticData: {
                memLayout: [{ size: 0 }]
            },
            memory: {
                usage: 0,
                tweenedUsage: 0,
                max: 0
            },
            cpu: {
                cores: [],
                usage: 0,
                tweenedUsage: 0
            },
            network: {
                rx: 0,
                tx: 0
            }
        };
    },
    watch: {
        staticData(value) {
            let memory = 0;
            value.memLayout.forEach(mem => {
                memory += mem.size;
            });
            this.memory.max = Math.round(memory * 0.931322578);
        },
        "memory.usage"(value, old) {
            new Tween({ x: old })
                .to({ x: value }, 1000)
                .on("update", ({ x }) => {
                    this.memory.tweenedUsage = x;
                })
                .start();
        },
        "cpu.usage"(value, old) {
            new Tween({ x: old })
                .to({ x: value }, 1000)
                .on("update", ({ x }) => {
                    this.cpu.tweenedUsage = x;
                })
                .start();
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
    },
    methods: {
        connect() {
            console.log("Connecting to " + this.address);
            this.ws = null;
            this.ws = new WebSocket(
                (this.secure === "true" ? "wss://" : "ws://") + this.address
            );

            this.ws.addEventListener("open", this.open);
            this.ws.addEventListener("message", this.message);
            this.ws.addEventListener("close", this.close);
            this.ws.addEventListener("error", this.error);

            this.pause = true;
        },
        open(event) {
            console.log("Connected to " + this.address);
            console.log("Authenticating...");
            this.ws.send(process.env.VUE_APP_TOKEN);
            this.cd = 1;

            this.pause = false;
        },
        message(event) {
            this.active = true;

            try {
                var parsed = JSON.parse(event.data);
            } catch (error) {
                return;
            }
            this.staticData = parsed.staticData;

            this.memory.usage = parsed.dynamicData.mem.used * 0.931322578;

            this.cpu.cores = parsed.dynamicData.currentLoad.cpus;
            let usage = 0;
            for (core of this.cpu.cores) {
                usage += core.load;
            }
            usage /= this.cpu.cores.length;
            this.cpu.usage = usage;

            this.network.tx = Math.floor(parsed.dynamicData.network[0].tx_sec);
            this.network.rx = Math.floor(parsed.dynamicData.network[0].rx_sec);
        },
        close(event) {
            console.log("Disconnected from " + this.address);

            this.pause = true;
        },
        error(event) {
            console.log("Error from " + this.address);
        }
    },
    beforeDestroy() {
        clearInterval(this.reconnectInterval);
        clearInterval(this.deadInterval);
        this.ws.close();
    }
};
</script>

<style scoped>
.center {
    position: relative;
    top: 50%;
    transform: translateY(-150%);
    text-align: center;
    font-size: 300%;
    font-weight: bolder;
    font-family: monospace;
    z-index: 1000000;
}
.connecting {
    background-color: rgba(0, 200, 0, 0.3);
}
.disconnected {
    background-color: rgba(200, 0, 0, 0.3);
}
.sysinfo {
    font-weight: bolder;
    font-size: 115%;
}
.cpu {
    position: relative;
    transform: translateY(5%);
    top: 50%;
    margin-right: 0px;
}
</style>
