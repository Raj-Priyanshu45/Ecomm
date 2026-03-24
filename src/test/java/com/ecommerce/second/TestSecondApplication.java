package com.ecommerce.second;

import org.springframework.boot.SpringApplication;

public class TestSecondApplication {

	public static void main(String[] args) {
		SpringApplication.from(SecondApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
