package com.synapse.synapse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;



@Configuration
public class S3Config {

    /*@Bean
    public S3Client s3Client(
            @Value("${spring.aws.region}") String region
    ) {
        return S3Client.builder()
                .region(Region.of(region))
                .build(); // AWS SDK reads env vars automatically
    }*/
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .credentialsProvider(
                        software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider.create()
                )
                .region(Region.of(System.getenv("AWS_REGION")))
                .build();
    }
}
