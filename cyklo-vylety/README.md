# CYKLO VÝLETY

Složka se seznamem cyklistických výletů. Stačí ji mít v počítači a otevřít `index.html`. Později celou složku zkopírujete na web (FTP, hosting). Žádný build, žádný Node.

Web odhadů nemovitostí v kořeni tohoto repozitáře se nemění.

## Jak otevřít

**Nejjednodušší:** dvojklik na `index.html`.

Nebo z příkazové řádky (spolehlivější pro mapy):

```bash
cd cyklo-vylety
python3 -m http.server 5173
```

Pak v prohlížeči: http://localhost:5173

## Co uvnitř

| soubor | význam |
| --- | --- |
| `index.html` | stránka |
| `styles.css` | vzhled |
| `app.js` | seznam, uložení, mapy |
| `photos/` | fotky k výletům (placeholder můžete nahradit) |

První zapsaný výlet je z roku **2020**: Slavonín – Grygov – Les Království (les u Grygova, zastávka u velkého dubu u trati).

Další výlety přidáte tlačítkem **Přidat výlet**. Data se ukládají v prohlížeči; **Stáhnout zálohu** uloží JSON.
