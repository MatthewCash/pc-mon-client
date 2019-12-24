<template>
    <div class="h-screen w-screen max-h-screen max-w-screen">
        <Device address="inferno:10180" secure="false" />
    </div>
</template>

<script>
import Device from './components/Device.vue';

export default {
    name: 'app',
    components: {
        Device
    }
};
</script>
