<script>
import { Line } from 'vue-chartjs';
import 'chartjs-plugin-streaming';

export default {
    extends: Line,
    props: ['usage', 'max', 'pause'],
    mounted() {
        this.render();
    },
    watch: {
        max(value) {
            this.render();
        },
        pause(value) {
            this.render();
        }
    },
    methods: {
        render() {
            this.renderChart(
                {
                    datasets: [
                        {
                            label: 'Usage',
                            borderColor: 'rgb(1, 5, 235)',
                            backgroundColor: 'rgba(1, 5, 235, 0.5)'
                        }
                    ]
                },
                {
                    maintainAspectRatio: false,
                    scales: {
                        xAxes: [
                            {
                                type: 'realtime',
                                realtime: {
                                    onRefresh: chart => {
                                        let usage = this.usage;
                                        chart.data.datasets.forEach(dataset => {
                                            dataset.data.push({
                                                x: Date.now(),
                                                y: usage
                                            });
                                        });
                                    },
                                    duration: 30000,
                                    delay: 1000,
                                    pause: this.pause
                                }
                            }
                        ],
                        yAxes: [
                            {
                                ticks: {
                                    min: 0,
                                    max: this.max
                                }
                            }
                        ]
                    }
                }
            );
            this.$data._chart.canvas.style.height = '50vh';
        }
    }
};
</script>
