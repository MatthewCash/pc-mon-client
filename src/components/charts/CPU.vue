<script>
import { Line } from 'vue-chartjs';
import 'chartjs-plugin-streaming';

export default {
    extends: Line,
    props: ['system', 'user', 'pause'],
    mounted() {
        this.render();
    },
    watch: {
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
                            label: 'System',
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            boxWidth: 10
                        },

                        {
                            label: 'User',
                            borderColor: 'rgb(1, 5, 235)',
                            backgroundColor: 'rgba(1, 5, 235, 0.5)'
                        }
                    ]
                },
                {
                    legend: {
                        labels: {
                            boxWidth: 5,
                            usePointStyle: true
                        }
                    },
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
                                                y:
                                                    dataset.label === 'System'
                                                        ? this.system
                                                        : this.user
                                            });
                                        });
                                    },
                                    duration: 20000,
                                    delay: 1000,
                                    pause: this.pause
                                }
                            }
                        ],
                        yAxes: [
                            {
                                ticks: {
                                    min: 0,
                                    max: 100
                                },
                                stacked: true
                            }
                        ]
                    }
                }
            );
        }
    }
};
</script>
