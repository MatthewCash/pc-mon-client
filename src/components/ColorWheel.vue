<template>
    <div class="wheel" :class="{ clicked }">
        <div
            class="selected"
            :style="{ transform: `rotate(${pos}deg)` }"
            :class="{ clicked, 'cycle-transition': cycle && canUpdate, 'transition': canUpdate && !cycle }"
        >
            <div v-show="showDot" class="dot" :class="{ clicked }"></div>
        </div>
        <div class="inside">
            <div
                class="center"
                :class="{ 'cycle-transition': cycle && canUpdate, 'transition': canUpdate && !cycle }"
                :style="{ 'background-color': `hsl(${this.pos},100%,50%)` }"
            ></div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        hue: Number,
        cycle: Boolean,
        active: Boolean
    },
    data() {
        return {
            clicked: false,
            pos: 0,
            prevAngle: null,
            canUpdate: true
        };
    },
    computed: {
        showDot() {
            return this.clicked || this.active;
        }
    },
    watch: {
        hue(hue, oldHue) {
            if (!this.canUpdate) return;
            const oldPos = this.pos;

            if (hue < oldHue) {
                if (oldHue - hue < 180) {
                    // Left
                    this.pos = Math.floor(oldPos / 360) * 360 + hue;
                } else {
                    // Right over 0
                    this.pos = oldPos + 360 + (hue - oldHue);
                }
            } else {
                if (hue - oldHue < 180) {
                    // Right
                    this.pos = Math.floor(oldPos / 360) * 360 + hue;
                } else {
                    // Left over 0
                    this.pos = oldPos - 360 + (hue - oldHue);
                }
            }
        }
    },
    methods: {
        setHue(hue) {
            this.pos = hue;
            this.$emit('update:hue', hue);
        },
        rotate(event) {
            if (!this.clicked) return;

            const box = this.$el.getBoundingClientRect();

            const wheelCenter = {
                x: box.left + box.width / 2,
                y: box.top + box.height / 2
            };

            const point = event.targetTouches ? event.targetTouches[0] : event;

            const mouseAngle =
                (Math.atan2(
                    point.clientY - wheelCenter.y,
                    point.clientX - wheelCenter.x
                ) *
                    180) /
                    Math.PI +
                90;

            if (this.prevAngle == null) return (this.prevAngle = mouseAngle);
            let changeAngle = mouseAngle - this.prevAngle + this.pos;

            while (changeAngle >= 360) changeAngle -= 360;
            while (changeAngle < 0) changeAngle += 360;

            this.setHue(changeAngle);

            this.prevAngle = mouseAngle;
        },
        click() {
            this.clicked = true;
            this.canUpdate = false;
            clearTimeout(this.clickTimeout);
        },
        unClick() {
            this.clicked = false;
            this.prevAngle = null;
            this.clickTimeout = setTimeout(() => (this.canUpdate = true), 1000);
        }
    },
    mounted() {
        this.$el.addEventListener('touchstart', this.click, {
            passive: true
        });
        document.addEventListener('touchend', this.unClick, {
            passive: true
        });
        document.addEventListener('touchcancel', this.unClick, {
            passive: true
        });
        document.addEventListener('touchmove', this.rotate, {
            passive: false
        });
        this.$el.addEventListener('mousedown', this.click, {
            passive: true
        });
        document.addEventListener('mouseup', this.unClick, {
            passive: true
        });
        document.addEventListener('mouseleave', this.unClick, {
            passive: true
        });
        document.addEventListener('mousemove', this.rotate, {
            passive: false
        });
    },
    beforeDestroy() {
        this.$el.removeEventListener('touchstart', this.click);
        document.removeEventListener('touchend', this.unClick);
        document.removeEventListener('touchcancel', this.unClick);
        document.removeEventListener('touchmove', this.rotate);
        this.$el.removeEventListener('mousedown', this.click);
        document.removeEventListener('mouseup', this.unClick);
        document.removeEventListener('mouseleave', this.unClick);
        document.removeEventListener('mousemove', this.rotate);
        clearTimeout(this.clickTimeout);
    }
};
</script>

<style lang="scss" scoped>
.wheel {
    /* margin-left: 100; */
    position: fixed;
    border-radius: 50%;
    height: 300px;
    width: 300px;
    z-index: 1000;
    background-size: 100% 100%;
    background-image: conic-gradient(
        red,
        yellow,
        lime,
        aqua,
        blue,
        magenta,
        red
    );
    transition: all 0.05s ease-in-out;
    border-width: 10px;
    border-color: #2d3748;
}
.inside {
    margin: 16.667% 0px 0px 16.667%;
    width: 66.667%;
    height: 66.667%;
    top: 50%;
    left: 50%;
    background-color: black;
    border-width: 10px;
    border-color: #2d3748;
    border-radius: 50%;
}
.center {
    margin: calc(50% - 40% / 2);
    width: 40%;
    height: 40%;
    border-radius: 50%;
    border-width: 10px;
    border-color: #2d3748;
    z-index: 1000;
}
.selected {
    /* position: static; */
    width: 300px;
    height: 300px;
    position: fixed;
    margin: -10px;
    transition: height 0.05s ease-in-out, width 0.05s ease-in-out,
        margin 0.05s ease-in-out;
}
.dot {
    background-color: white;
    border-radius: 50%;
    margin-left: 137.5px;
    margin-top: 21px;
    width: 25px;
    height: 25px;
    margin: 135px 0px 0px 0px 0%;
    z-index: 100;
    /* position: fixed; */
    transition: all 0.05s ease-in-out;
}
.clicked.wheel {
    margin: -10px;
    width: 320px;
    height: 320px;
}
.clicked.selected {
    width: 320px;
    height: 320px;
}
.clicked.dot {
    margin-top: 25px;
}
.cycle-transition {
    transition: all 3.2s linear;
}
.transition {
    transition: all 1s ease-in-out;
}
</style>