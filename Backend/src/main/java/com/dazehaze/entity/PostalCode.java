package com.dazehaze.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "postal_codes", indexes = {
        @Index(name = "idx_postal_code", columnList = "code")
})
public class PostalCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String code; // d_codigo

    @Column(nullable = false, length = 255)
    private String settlement; // d_asenta (Colonia)

    @Column(nullable = false, length = 255)
    private String settlementType; // d_tipo_asenta (Colonia, Pueblo, etc)

    @Column(nullable = false, length = 255)
    private String municipality; // D_mnpio

    @Column(nullable = false, length = 255)
    private String state; // d_estado

    @Column(length = 255)
    private String city; // d_ciudad

    @Column(length = 255)
    private String stateCode; // c_estado (optional, for code mapping)
}
