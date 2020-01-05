<template>
    <div class="wheel" :class="{ clicked }">
        <div class="selected" :style="{ transform: `rotate(${pos}deg)` }" :class="{ clicked }">
            <div class="dot" :class="{ clicked }"></div>
        </div>
        <div class="inside">
            <div class="center" :style="{ 'background-color': `hsl(${this.pos},100%,50%)` }"></div>
        </div>
    </div>
</template>

<script>
import { Tween, autoPlay, Easing } from "es6-tween";
autoPlay(true);
export default {
    props: {
        hue: Number,
        cycle: Boolean
    },
    data() {
        return {
            clicked: false,
            pos: 0,
            prevAngle: null,
            canUpdate: true
        };
    },
    watch: {
        hue(value) {
            if (!this.canUpdate) return;
            let old = this.pos;
            if (old > value && old - value > 180) old -= 360;
            if (value > old && value - old > 180) old += 360;
            new Tween({ x: old })
                .to({ x: value }, 2200)
                .on("update", ({ x }) => {
                    if (!this.canUpdate) return;
                    this.pos = x;
                })
                .easing(this.cycle ? Easing.Linear : Easing.Quadratic.InOut)
                .start();
        }
    },
    methods: {
        setHue(hue) {
            this.pos = hue;
            this.$emit("update:hue", hue);
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
        this.$el.addEventListener("touchstart", this.click, {
            passive: true
        });
        document.addEventListener("touchend", this.unClick, {
            passive: true
        });
        document.addEventListener("touchcancel", this.unClick, {
            passive: true
        });
        document.addEventListener("touchmove", this.rotate, {
            passive: false
        });
        this.$el.addEventListener("mousedown", this.click, {
            passive: true
        });
        document.addEventListener("mouseup", this.unClick, {
            passive: true
        });
        document.addEventListener("mouseleave", this.unClick, {
            passive: true
        });
        document.addEventListener("mousemove", this.rotate, {
            passive: false
        });
    },
    beforeDestroy() {
        this.$el.removeEventListener("touchstart", this.click);
        document.removeEventListener("touchend", this.unClick);
        document.removeEventListener("touchcancel", this.unClick);
        document.removeEventListener("touchmove", this.rotate);
        this.$el.removeEventListener("mousedown", this.click);
        document.removeEventListener("mouseup", this.unClick);
        document.removeEventListener("mouseleave", this.unClick);
        document.removeEventListener("mousemove", this.rotate);
        clearTimeout(this.clickTimeout);
    }
};
</script>

<style scoped>
.wheel {
    position: fixed;
    border-radius: 50%;
    height: 300px;
    width: 300px;
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
}
.inside {
    margin: 16.667% 0px 0px 16.667%;
    width: 66.667%;
    height: 66.667%;
    top: 50%;
    left: 50%;
    background-color: black;
    border-radius: 50%;
}
.center {
    margin: 37.5% 0px 0px 37.5%;
    width: 25%;
    height: 25%;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    border-width: 5px;
    border-color: white;
    z-index: 1000;
}
.selected {
    position: static;
    width: 300px;
    height: 300px;
    border-width: 0px;
    border-color: yellow;
    position: fixed;
    transition: height 0.05s ease-in-out, width 0.05s ease-in-out,
        margin 0.05s ease-in-out;
}
.dot {
    background-color: white;
    border-radius: 50%;
    margin-left: 137.5px;
    margin-top: 12.5px;
    width: 25px;
    height: 25px;
    margin: 135px 0px 0px 0px 0%;
    z-index: 100;
    position: fixed;
    transition: all 0.05s ease-in-out;
}
.clicked.wheel {
    margin-top: -10px;
    width: 320px;
    height: 320px;
}
.clicked.selected {
    width: 320px;
    height: 320px;
}
.clicked.dot {
    margin-top: 15px;
}
</style>