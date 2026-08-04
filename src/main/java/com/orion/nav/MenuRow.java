package com.orion.nav;

import lombok.Getter;

/**
 * index.zul'daki sol menu listbox'inin duz (flattened) modeli. ZK'nin
 * bu projede kullanilan basit `listbox`'i hiyerarsik veri (TreeModel)
 * kabul etmedigi icin, `MenuRegistry`'nin agac yapisi (MenuItem.children)
 * her render'da bu duz satir listesine cozulur: bir ust-menu genisletil-
 * misse (expanded) hemen ardindan cocuklari da ayri birer satir olarak
 * eklenir. Boylece mevcut tek-seviyeli listbox+template altyapisi
 * degismeden coklu seviye gorunumu elde edilir.
 */
@Getter
public class MenuRow {

    private final MenuItem item;
    private final boolean child;
    private final boolean expanded;

    public MenuRow(MenuItem item, boolean child, boolean expanded) {
        this.item = item;
        this.child = child;
        this.expanded = expanded;
    }
}
