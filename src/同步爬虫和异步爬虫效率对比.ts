import * as echarts from 'echarts'

const dom = document.getElementById('container')
const myChart = echarts.init(dom!, {}, { renderer: 'svg' })

const colors = [
    '#1089E7',
    '#F57474',
    '#56D0E3',
    '#F8B448',
    '#8B78F6'
];

const names = ['同步爬虫', '异步爬虫']

const values = [650.712683, 20.837937]

const option: echarts.EChartsOption = {
    backgroundColor: '#0e2147',
    title: {
        text: '同步爬虫和异步爬虫效率对比',
        textStyle: {
            color: '#fff',
            fontSize: 26
        },
        left: 'center',
        top: '5%',
        subtext: '爬取 1000 个页面的耗时',
        subtextStyle: {
            color: 'rgba(255,255,255,.8)',
            fontSize: 16,
            fontWeight: 200,
            align: 'center'
        }
    },
    tooltip: {
        trigger: 'item'
    },
    xAxis: {
        show: false
    },
    yAxis: {
        show: true,
        data: names,
        inverse: true,
        axisLine: {
            show: false
        },
        splitLine: {
            show: false
        },
        axisTick: {
            show: false
        },
        axisLabel: {
            color: (value?: string | number | undefined, index?: number | undefined): string => {
                return colors[index as number]
            },
            fontSize: 14
        }
    },
    series: [
        {
            name: '耗时',
            type: 'bar',
            yAxisIndex: 0,
            data: values,
            barWidth: 30,
            tooltip: {
                show: true,
                formatter: '{a}: {c}'
            },
            itemStyle: {
                borderRadius: 30,
                color: (params) => {
                    return colors[params.dataIndex]
                }
            },
            label: {
                show: true,
                position: 'right',
                formatter: (params) => {
                    return params.data.toString() + ' 秒'
                }
            }
        }
    ]
}

myChart.setOption(option)
