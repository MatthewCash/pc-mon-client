<template>
    <div class="h-screen w-screen max-h-screen max-w-screen select-none">
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