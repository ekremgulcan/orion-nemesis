package com.orion.risk.domain;

import com.orion.core.domain.Instrument;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "instrument_groups")
@Getter
@Setter
public class InstrumentGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private Long id;

    @Column(name = "grup_kodu", nullable = false, unique = true)
    private String grupKodu;

    @Column(name = "aciklama")
    private String aciklama;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @ManyToMany
    @JoinTable(
            name = "instrument_group_members",
            joinColumns = @JoinColumn(name = "group_id"),
            inverseJoinColumns = @JoinColumn(name = "instrument_id")
    )
    private Set<Instrument> uyeler = new HashSet<>();

    /** ZUL tarafinda tek hucrede virgulle ayrilmis sembol listesi gostermek icin. */
    public String getUyelerMetni() {
        return uyeler.stream()
                .map(Instrument::getSembol)
                .sorted()
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }
}
