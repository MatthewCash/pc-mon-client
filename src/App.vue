<template>
    <div class="h-screen w-screen max-h-screen max-w-screen">
        <!-- <Device v-if="panel" v-hammer:swipe="openPanel" address="inferno:10180" secure="false" /> -->
        <Panel />
    </div>
</template>

<script>
// import Device from "./components/Device.vue";
import Panel from './components/Panel.vue';

export default {
    name: 'app',
    components: {
        Panel
    },
    data() {
        return {
            panel: false
        };
    },
    methods: {
        openPanel() {
            this.panel = true;
            // this.panelTimeout = setTimeout(() => void this.closePanel(), 20000);
        },
        closePanel() {
            this.panel = false;
            // clearTimeout(this.panelTimeout);
        }
    }
};
</script>

<style>
* {
    overflow: hidden;
}
html {
    box-sizing: border-box;
}
*,
*:before,
*:after {
    box-sizing: inherit;
}
</style>