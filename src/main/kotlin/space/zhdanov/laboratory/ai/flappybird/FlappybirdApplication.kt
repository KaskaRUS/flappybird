package space.zhdanov.laboratory.ai.flappybird

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class FlappybirdApplication

fun main(args: Array<String>) {
    runApplication<FlappybirdApplication>(*args)
}
