/* Generat din date/proiect.json — nu edita manual */
window.PROIECT = {
  "meta": {
    "object": "Apartament, mun. Chișinău, str. Doina și Ion Aldea-Teodorovici",
    "client": "Marjina Constantin",
    "design": {
      "studio": "Space Design Studio",
      "coordinator": "Arnaut Sebastian",
      "designer": "Stomati Mihail",
      "projectant": "Nemțanu Olga",
      "file": "PROIECT FINAL_CLUB HOUSE.pdf",
      "plans": 27,
      "phones": [
        "+373 60 95 20 56",
        "+373 60 40 90 57"
      ]
    },
    "area": {
      "interior_borderou_m2": 101.85,
      "rooms_in_borderou": 6,
      "loggia_bucatarie_m2": 8.76,
      "loggia_dormitor_m2": 5.68,
      "terasa_deviz_m2": 3.88,
      "terasa_borderou_gresie_m2": 4.5
    },
    "currency": "MDL",
    "rule": "Doar date din documentele sursă. Nu s-au inventat prețuri. Lista Constantin NU se adună peste ofertele-sursă.",
    "extracted_at": "2026-10-17",
    "source_files": [
      {
        "file": "PROIECT FINAL_CLUB HOUSE.pdf",
        "role": "proiect design, cantități, încăperi — fără prețuri",
        "date": "2026-09-22"
      },
      {
        "file": "Oferta_detaliata_DoinaAldeaTeodorovici_2026.pdf",
        "role": "deviz manoperă pe încăperi, fără TVA, fără materiale",
        "date": "2026-10-07",
        "valid_days": 30
      },
      {
        "file": "Constantin - Pret Mobilier.pdf",
        "role": "ofertă mobilier pe piese",
        "date": "2026-10-07"
      },
      {
        "file": "Oferta.Arnaut.Sebastian.Simplex.17.09.2026.pdf",
        "role": "ofertă obiecte sanitare",
        "date": "2026-09-17"
      },
      {
        "file": "Oferta comerciala-premium - SpaceDesign.pdf",
        "role": "ofertă gresie plitka.md",
        "date": "2026-10-13"
      },
      {
        "file": "19210.pdf",
        "role": "cont de plată vopsea STO (cu TVA)",
        "date": "2026-10-13"
      },
      {
        "file": "Lista Constantin.pdf",
        "role": "listă compilată — dubluri + o linie inexistentă în surse",
        "date": "2026-10-15"
      }
    ]
  },
  "rooms": [
    {
      "id": "lucrari_generale",
      "name": "Lucrări generale pe obiect",
      "area_m2": null,
      "in_borderou_101_85": false
    },
    {
      "id": "antreu",
      "name": "Antreu / hol",
      "area_m2": 15.92,
      "in_borderou_101_85": true,
      "project_room_no": 1
    },
    {
      "id": "living_bucatarie",
      "name": "Living + bucătărie",
      "area_m2": 36.25,
      "in_borderou_101_85": true,
      "project_room_no": 2,
      "note": "În devizul de manoperă livingul și bucătăria sunt o singură încăpere. Nu există split de manoperă."
    },
    {
      "id": "dormitor_matrimonial",
      "name": "Dormitor matrimonial",
      "area_m2": 25.59,
      "in_borderou_101_85": true,
      "project_room_no": 3
    },
    {
      "id": "dormitor",
      "name": "Dormitor",
      "area_m2": 17.31,
      "in_borderou_101_85": true,
      "project_room_no": 4
    },
    {
      "id": "baie",
      "name": "Baie",
      "area_m2": 4.67,
      "in_borderou_101_85": true,
      "project_room_no": 5
    },
    {
      "id": "gts",
      "name": "Grup sanitar (GTS / WC)",
      "area_m2": 2.11,
      "in_borderou_101_85": true,
      "project_room_no": 6
    },
    {
      "id": "loggia_bucatarie",
      "name": "Loggia bucătărie (dining / birou)",
      "area_m2": 8.76,
      "in_borderou_101_85": false
    },
    {
      "id": "loggia_dormitor",
      "name": "Loggia dormitor (zonă machiaj)",
      "area_m2": 5.68,
      "in_borderou_101_85": false
    },
    {
      "id": "terasa",
      "name": "Terasă",
      "area_m2": 3.88,
      "in_borderou_101_85": false,
      "note": "Devizul folosește 3.88 m²; borderoul de pardoseală indică 4.5 m² gresie terasă."
    },
    {
      "id": "obiect",
      "name": "Pe tot obiectul / neseparat pe încăperi",
      "area_m2": 101.85,
      "in_borderou_101_85": true
    }
  ],
  "how_to_query": {
    "total_priced_no_double_count": "totals.primary_sources.total_using_simplex_line_sum",
    "kitchen_bath_wc": "scenarios.bucatarie_baie_gts",
    "per_room": "by_room.<room_id>",
    "do_not_add": "lista_constantin (este compilare; produce dubluri)",
    "vat": "Manopera e fără TVA. Factura STO include TVA 20%. Restul documentelor nu declară TVA."
  },
  "totals": {
    "primary_sources": {
      "manopera_deviz_fara_tva": 443770,
      "manopera_directa": 338304,
      "manopera_markups": 105466,
      "mobilier": 379000,
      "gresie_plitka_cu_reducere_5pct": 49166,
      "gresie_stratos_vein_doar_lista_constantin": 7550,
      "vopsea_factura_sto_cu_tva": 26917.3,
      "vopsea_tva_inclus": 4486.21,
      "plinta_arbiton_doar_lista_constantin": 1040,
      "sanitar_simplex_suma_linii": 57709,
      "sanitar_simplex_total_tiparit": 61704,
      "sanitar_diferenta_tipar_vs_linii": 3995,
      "total_using_simplex_line_sum": 965152.3,
      "total_using_simplex_printed": 969147.3,
      "note": "Suma categoriilor de mai sus, o singură dată fiecare. NU include Lista Constantin ca încă o categorie (ar dubla gresie/vopsea/sanitar). NU include opțiuni de manoperă, corpuri de iluminat, tapet-material, electrocasnice, uși, chiuvetă bucătărie-produs, panou sticlă duș-produs."
    },
    "labor_options_not_in_total": {
      "items": [
        {
          "code": "G02",
          "name": "Uși interioare cu toc (4 buc × 1 500)",
          "amount": 6000
        },
        {
          "code": "G01",
          "name": "Ușă intrare (1 × 4 000)",
          "amount": 4000
        },
        {
          "code": "H11",
          "name": "Ventilatoare băi (2 × 400)",
          "amount": 800
        },
        {
          "code": "I17",
          "name": "Pardoseală caldă electrică baie (4 m² × 360)",
          "amount": 1440
        },
        {
          "code": "D19",
          "name": "Fugă epoxidică pereți baie (21.9 m² × 200)",
          "amount": 4380
        },
        {
          "code": "I17",
          "name": "Pardoseală caldă electrică GTS (1.8 m² × 360)",
          "amount": 648
        },
        {
          "code": "D19",
          "name": "Fugă epoxidică pereți GTS (16.5 m² × 200)",
          "amount": 3300
        }
      ],
      "sum": 20568,
      "note": "Manoperă OPȚIUNE, exclusă din 443 770 conform devizului."
    },
    "lista_constantin_if_summed_alone": {
      "finisaje": 87316,
      "sanitar": 94312,
      "total": 181628,
      "do_not_add_on_top_of_primary": true
    }
  },
  "scenarios": {
    "bucatarie_baie_gts": {
      "question": "Cât costă bucătăria + baia + WC?",
      "labor_direct_living_plus_buc_plus_baie_plus_gts": 162487,
      "labor_living_buc_cannot_be_split": true,
      "labor_with_proportional_object_markups": 213142,
      "markup_allocation_note": "Adaosurile (transport/regie/beneficiu) sunt pe tot obiectul. Alocarea 162 487/338 304 × 105 466 este un calcul, nu o linie din documente.",
      "furniture": 167000,
      "furniture_parts": {
        "bucatarie": 125000,
        "baie1": 20000,
        "dulap_baie1": 11000,
        "mobilier_baie2_gts": 11000
      },
      "sanitary_simplex_line_sum": 57709,
      "gresie_memory_marfil_plus_rlv_plitka_discounted": 49166,
      "gresie_note": "Oferta plitka.md nu e spartă pe încăperi. Memory Marfil acoperă și terasa (4.5 m²) și placarea de bucătărie. Stratos Vein (living) NU e inclus aici.",
      "paint_not_split": "Vopseaua STO e pe tot apartamentul, nu e spartă pe încăperi.",
      "subtotal_labor_direct_plus_furniture_sanitary_gresie": 436362,
      "subtotal_with_proportional_labor_markups": 487017,
      "missing_from_this_scenario": [
        "produs chiuvetă bucătărie (doar manoperă S10 960)",
        "produs panou sticlă duș (doar manoperă G05 4 000)",
        "electrocasnice (aragaz, cuptoare, frigider, mașină vase, mașină spălat — doar în planșe, fără preț)",
        "vopsea, plintă, iluminat"
      ]
    },
    "doar_baie_plus_gts": {
      "labor_direct": 104030,
      "furniture": 42000,
      "sanitary_simplex_line_sum": 57709
    },
    "doar_bucatarie_ce_se_poate": {
      "labor": "Nu se poate izola. Living + bucătărie = 58 457 manoperă directă.",
      "furniture_bucatarie_only": 125000
    }
  },
  "by_room": {
    "lucrari_generale": {
      "name": "Lucrări generale pe obiect",
      "area_m2": null,
      "labor_direct": 92290,
      "furniture": [],
      "furniture_total": 0,
      "sanitary": [],
      "sanitary_total": 0
    },
    "antreu": {
      "name": "Antreu / hol",
      "area_m2": 15.92,
      "labor_direct": 17229,
      "furniture": [
        {
          "id": "antreu",
          "name": "Mobilier Antreu",
          "price": 39000
        }
      ],
      "furniture_total": 39000,
      "sanitary": [],
      "sanitary_total": 0
    },
    "living_bucatarie": {
      "name": "Living + bucătărie",
      "area_m2": 36.25,
      "labor_direct": 58457,
      "furniture": [
        {
          "id": "bucatarie",
          "name": "Bucătărie",
          "price": 125000
        },
        {
          "id": "living",
          "name": "Mobilier Living",
          "price": 32000
        }
      ],
      "furniture_total": 157000,
      "sanitary": [],
      "sanitary_total": 0
    },
    "dormitor_matrimonial": {
      "name": "Dormitor matrimonial",
      "area_m2": 25.59,
      "labor_direct": 22693,
      "furniture": [
        {
          "id": "dormitor_mat_dulap",
          "name": "Mobilier Dormitor+Dulap",
          "price": 36000
        },
        {
          "id": "tumba",
          "name": "Tumba",
          "price": 15000
        }
      ],
      "furniture_total": 51000,
      "sanitary": [],
      "sanitary_total": 0
    },
    "dormitor": {
      "name": "Dormitor",
      "area_m2": 17.31,
      "labor_direct": 20464,
      "furniture": [
        {
          "id": "dormitor2_birou",
          "name": "Mobilier Dormitor 2",
          "price": 36000
        },
        {
          "id": "dormitor2_pat",
          "name": "Mobilier Dormitor 2",
          "price": 48000
        }
      ],
      "furniture_total": 84000,
      "sanitary": [],
      "sanitary_total": 0
    },
    "baie": {
      "name": "Baie",
      "area_m2": 4.67,
      "labor_direct": 65941,
      "furniture": [
        {
          "id": "baie1",
          "name": "Baie 1",
          "price": 20000
        },
        {
          "id": "dulap_baie1",
          "name": "Dulap baie 1",
          "price": 11000
        }
      ],
      "furniture_total": 31000,
      "sanitary": [
        {
          "nr": 8,
          "name": "Baterie SKYLINE lavoar, cu ventil negru mat",
          "total": 4015
        },
        {
          "nr": 9,
          "name": "Set de dus TOKYO incorporat (2 piese), negru mat",
          "total": 15853
        },
        {
          "nr": 10,
          "name": "Set TECE Linus 600 mm",
          "total": 5350
        },
        {
          "nr": 11,
          "name": "Membrana TECEDrainline antimiros pentru sifoane",
          "total": 290
        },
        {
          "nr": 12,
          "name": "Sita par/impuritati TECEDrainline otel inox",
          "total": 393
        }
      ],
      "sanitary_total": 25901
    },
    "gts": {
      "name": "Grup sanitar (GTS / WC)",
      "area_m2": 2.11,
      "labor_direct": 38089,
      "furniture": [
        {
          "id": "baie2",
          "name": "Mobilier Baie 2",
          "price": 11000
        }
      ],
      "furniture_total": 11000,
      "sanitary": [
        {
          "nr": 1,
          "name": "Rama Roca DUPLO S pentru suspendarea WC",
          "total": 4300
        },
        {
          "nr": 2,
          "name": "Clapeta dubla actionare PS3 DUPLO S, negru mat",
          "total": 1423
        },
        {
          "nr": 3,
          "name": "Vas WC suspendat GAP, Rimless",
          "total": 5500
        },
        {
          "nr": 4,
          "name": "Capac WC GAP (Alegra) Slim, Soft Close",
          "total": 1613
        },
        {
          "nr": 5,
          "name": "Baterie SUVI dus igienic incorporat shut-off, negru mat",
          "total": 2990
        },
        {
          "nr": 6,
          "name": "Boxa Daniel incorporata pt lavoar, piese separate",
          "total": 6490
        },
        {
          "nr": 7,
          "name": "Baterie Tokyo lavoar pentru WBOX negru mat",
          "total": 9492
        }
      ],
      "sanitary_total": 31808
    },
    "loggia_bucatarie": {
      "name": "Loggia bucătărie (dining / birou)",
      "area_m2": 8.76,
      "labor_direct": 8825,
      "furniture": [
        {
          "id": "masa_rafturi",
          "name": "Masă + Rafturi",
          "price": 6000
        }
      ],
      "furniture_total": 6000,
      "sanitary": [],
      "sanitary_total": 0
    },
    "loggia_dormitor": {
      "name": "Loggia dormitor (zonă machiaj)",
      "area_m2": 5.68,
      "labor_direct": 5131,
      "furniture": [],
      "furniture_total": 0,
      "sanitary": [],
      "sanitary_total": 0
    },
    "terasa": {
      "name": "Terasă",
      "area_m2": 3.88,
      "labor_direct": 9185,
      "furniture": [],
      "furniture_total": 0,
      "sanitary": [],
      "sanitary_total": 0
    },
    "obiect": {
      "name": "Pe tot obiectul / neseparat pe încăperi",
      "area_m2": 101.85,
      "labor_direct": null,
      "furniture": [],
      "furniture_total": 0,
      "sanitary": [],
      "sanitary_total": 0,
      "labor_markups": 105466,
      "labor_total_deviz": 443770,
      "paint_sto": 26917.3,
      "plinta": 1040,
      "gresie_plitka_after_discount": 49166,
      "gresie_stratos_lista": 7550
    }
  },
  "labor": {
    "source": "Oferta_detaliata_DoinaAldeaTeodorovici_2026.pdf",
    "date": "2026-10-07",
    "vat": "fara_TVA",
    "materials_included": false,
    "validity_days": 30,
    "indicator_mdl_per_m2_fara_tva": 4357,
    "indicator_area_m2": 101.85,
    "direct_by_room": {
      "lucrari_generale": 92290,
      "antreu": 17229,
      "living_bucatarie": 58457,
      "dormitor_matrimonial": 22693,
      "dormitor": 20464,
      "baie": 65941,
      "gts": 38089,
      "loggia_bucatarie": 8825,
      "loggia_dormitor": 5131,
      "terasa": 9185
    },
    "markups": [
      {
        "id": "transport",
        "name": "Transport 6 % (pe suma deja majorată)",
        "amount": 20298
      },
      {
        "id": "regie",
        "name": "Regie 12.5 % (pe suma deja majorată)",
        "amount": 44825
      },
      {
        "id": "beneficiu",
        "name": "Beneficiu de deviz 10 % (pe suma deja majorată)",
        "amount": 40343
      }
    ],
    "total_fara_tva": 443770,
    "lines": [
      {
        "room": "lucrari_generale",
        "code": "A00",
        "name": "Verificarea stării suportului, proces-verbal",
        "um": "k-t",
        "qty": 1,
        "unit_price": 2000,
        "total": 2000,
        "option": false,
        "comment": "stare locuit — verificare suport, proces-verbal"
      },
      {
        "room": "lucrari_generale",
        "code": "A01",
        "name": "Servicii organizare șantier, livrări materiale, gestionare",
        "um": "obiect",
        "qty": 1,
        "unit_price": 30000,
        "total": 30000,
        "option": false,
        "comment": "o dată pe obiect"
      },
      {
        "room": "lucrari_generale",
        "code": "A02",
        "name": "Electricitate temporară șantier",
        "um": "set",
        "qty": 1,
        "unit_price": 0,
        "total": 0,
        "option": false
      },
      {
        "room": "lucrari_generale",
        "code": "A03",
        "name": "Alimentare cu apă și canalizare temporară șantier",
        "um": "set",
        "qty": 1,
        "unit_price": 1500,
        "total": 1500,
        "option": false
      },
      {
        "room": "lucrari_generale",
        "code": "A04",
        "name": "Deconectare electricitate",
        "um": "k-t",
        "qty": 1,
        "unit_price": 1000,
        "total": 1000,
        "option": false
      },
      {
        "room": "lucrari_generale",
        "code": "A05",
        "name": "Deconectare apă",
        "um": "k-t",
        "qty": 1,
        "unit_price": 1000,
        "total": 1000,
        "option": false
      },
      {
        "room": "lucrari_generale",
        "code": "A08",
        "name": "Protejare geamuri",
        "um": "buc",
        "qty": 9,
        "unit_price": 200,
        "total": 1800,
        "option": false,
        "comment": "ferestre + uși vitrate loggii/terasă"
      },
      {
        "room": "lucrari_generale",
        "code": "A09",
        "name": "Protejare ușă intrare",
        "um": "buc",
        "qty": 1,
        "unit_price": 500,
        "total": 500,
        "option": false
      },
      {
        "room": "lucrari_generale",
        "code": "A10",
        "name": "Protejare uși existente (rămân, nu se demontează)",
        "um": "buc",
        "qty": 4,
        "unit_price": 500,
        "total": 2000,
        "option": false,
        "comment": "ușile interioare rămân (dacă se schimbă — vezi opțiuni)"
      },
      {
        "room": "lucrari_generale",
        "code": "A12",
        "name": "Demontare / remontare calorifere",
        "um": "buc",
        "qty": 3,
        "unit_price": 1200,
        "total": 3600,
        "option": false,
        "comment": "loggia bucătărie, dormitor, loggia dormitor"
      },
      {
        "room": "lucrari_generale",
        "code": "A13",
        "name": "Demontare instalații vechi (electrice / sanitare)",
        "um": "k-t",
        "qty": 1,
        "unit_price": 5000,
        "total": 5000,
        "option": false,
        "comment": "instalații vechi băi"
      },
      {
        "room": "lucrari_generale",
        "code": "A22",
        "name": "Încărcare moloz în saci",
        "um": "sac",
        "qty": 260,
        "unit_price": 20,
        "total": 5200,
        "option": false,
        "comment": "moloz băi + teracotă bucătărie + resturi"
      },
      {
        "room": "lucrari_generale",
        "code": "A23",
        "name": "Hamali — ridicare, coborâre, descărcare materiale / moloz",
        "um": "oră",
        "qty": 16,
        "unit_price": 250,
        "total": 4000,
        "option": false,
        "comment": "coborâre moloz / urcare materiale"
      },
      {
        "room": "lucrari_generale",
        "code": "A24",
        "name": "Evacuare moloz + transport",
        "um": "m³",
        "qty": 8,
        "unit_price": 845,
        "total": 6760,
        "option": false,
        "comment": "trei curse"
      },
      {
        "room": "lucrari_generale",
        "code": "F13",
        "name": "Plintă lemn / MDF / ipsos H 100",
        "um": "ml",
        "qty": 45.5,
        "unit_price": 140,
        "total": 6370,
        "option": false,
        "comment": "plintă ARBITON STIQ S0611 — borderou 45,5 ml"
      },
      {
        "room": "lucrari_generale",
        "code": "X03",
        "name": "Curățenie pe parcurs",
        "um": "m²",
        "qty": 116,
        "unit_price": 10,
        "total": 1160,
        "option": false,
        "comment": "pe toată durata"
      },
      {
        "room": "lucrari_generale",
        "code": "X04",
        "name": "Curățenie generală finală",
        "um": "m²",
        "qty": 102,
        "unit_price": 200,
        "total": 20400,
        "option": false,
        "comment": "la predare"
      },
      {
        "room": "lucrari_generale",
        "code": "G02",
        "name": "Ușă interioară cu toc",
        "um": "buc",
        "qty": 4,
        "unit_price": 1500,
        "total": null,
        "option": true,
        "comment": "OPȚIUNE — dacă se schimbă ușile interioare"
      },
      {
        "room": "lucrari_generale",
        "code": "G01",
        "name": "Ușă intrare",
        "um": "buc",
        "qty": 1,
        "unit_price": 4000,
        "total": null,
        "option": true,
        "comment": "OPȚIUNE — dacă se schimbă ușa de intrare"
      },
      {
        "room": "lucrari_generale",
        "code": "H11",
        "name": "Ventilator baie",
        "um": "buc",
        "qty": 2,
        "unit_price": 400,
        "total": null,
        "option": true,
        "comment": "OPȚIUNE — ventilatoare băi"
      },
      {
        "room": "antreu",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton)",
        "um": "m²",
        "qty": 15.92,
        "unit_price": 30,
        "total": 478,
        "option": false,
        "comment": "pardoseală + mobilier rămas"
      },
      {
        "room": "antreu",
        "code": "I04",
        "name": "Trasare circuite electrice (canale, tuburi, doze)",
        "um": "punct",
        "qty": 3,
        "unit_price": 350,
        "total": 1050,
        "option": false,
        "comment": "2 aplice, LED oglindă"
      },
      {
        "room": "antreu",
        "code": "I01",
        "name": "Șanțare pereți / podea, material altul decât beton, lățime ≤ 6 cm",
        "um": "ml",
        "qty": 8,
        "unit_price": 80,
        "total": 640,
        "option": false,
        "comment": "șanțuri cabluri noi — nu în pardoseala cu încălzire"
      },
      {
        "room": "antreu",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 15,
        "unit_price": 80,
        "total": 1200,
        "option": false,
        "comment": "trasee cablu în tub"
      },
      {
        "room": "antreu",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 3,
        "unit_price": 70,
        "total": 210,
        "option": false
      },
      {
        "room": "antreu",
        "code": "H16",
        "name": "Blocare priză / doză veche (dezafectare, izolare, astupare cu glet)",
        "um": "buc",
        "qty": 1,
        "unit_price": 150,
        "total": 150,
        "option": false,
        "comment": "prize/doze vechi care se blochează înainte de vopsire"
      },
      {
        "room": "antreu",
        "code": "H03",
        "name": "Demontare + montare priză existentă",
        "um": "buc",
        "qty": 3,
        "unit_price": 80,
        "total": 240,
        "option": false,
        "comment": "prize existente — demontare pentru vopsire + remontare"
      },
      {
        "room": "antreu",
        "code": "H04",
        "name": "Demontare + montare întrerupător existent",
        "um": "buc",
        "qty": 3,
        "unit_price": 80,
        "total": 240,
        "option": false,
        "comment": "întrerupătoare existente — idem"
      },
      {
        "room": "antreu",
        "code": "H15",
        "name": "Demontare și remontare spot existent (pentru vopsirea tavanului)",
        "um": "buc",
        "qty": 12,
        "unit_price": 80,
        "total": 960,
        "option": false,
        "comment": "spoturi existente în tavan"
      },
      {
        "room": "antreu",
        "code": "H06",
        "name": "Corp suspendat / aplică",
        "um": "buc",
        "qty": 2,
        "unit_price": 400,
        "total": 800,
        "option": false,
        "comment": "aplice / corp aplicat — montaj"
      },
      {
        "room": "antreu",
        "code": "H08",
        "name": "Bandă LED 24V (instalare + sudare)",
        "um": "ml",
        "qty": 8,
        "unit_price": 115,
        "total": 920,
        "option": false,
        "comment": "bandă LED nișă tavan"
      },
      {
        "room": "antreu",
        "code": "H09",
        "name": "Transformator / bloc alimentare LED",
        "um": "set",
        "qty": 1,
        "unit_price": 230,
        "total": 230,
        "option": false
      },
      {
        "room": "antreu",
        "code": "D05",
        "name": "Glet finish — strat 1",
        "um": "m²",
        "qty": 3,
        "unit_price": 65,
        "total": 195,
        "option": false,
        "comment": "glet local — reparații pe șanțuri, prize blocate, fisuri (orientativ 10 %)"
      },
      {
        "room": "antreu",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere",
        "um": "m²",
        "qty": 30,
        "unit_price": 30,
        "total": 900,
        "option": false
      },
      {
        "room": "antreu",
        "code": "D01",
        "name": "Amorsare pereți — un strat",
        "um": "m²",
        "qty": 30,
        "unit_price": 20,
        "total": 600,
        "option": false
      },
      {
        "room": "antreu",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi",
        "um": "m²",
        "qty": 30,
        "unit_price": 145,
        "total": 4350,
        "option": false,
        "comment": "vopsire 2 straturi — vopsea decorativă STO (F-1)"
      },
      {
        "room": "antreu",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 15.92,
        "unit_price": 30,
        "total": 478,
        "option": false
      },
      {
        "room": "antreu",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 15.92,
        "unit_price": 20,
        "total": 318,
        "option": false
      },
      {
        "room": "antreu",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 15.92,
        "unit_price": 145,
        "total": 2308,
        "option": false,
        "comment": "vopsea albă tavan, 2 straturi"
      },
      {
        "room": "antreu",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton) — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.59,
        "unit_price": 30,
        "total": 48,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "antreu",
        "code": "D05",
        "name": "Glet finish — strat 1 — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.3,
        "unit_price": 65,
        "total": 20,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "antreu",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3,
        "unit_price": 30,
        "total": 90,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "antreu",
        "code": "D01",
        "name": "Amorsare pereți — un strat — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3,
        "unit_price": 20,
        "total": 60,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "antreu",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3,
        "unit_price": 145,
        "total": 435,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "antreu",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.59,
        "unit_price": 30,
        "total": 48,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "antreu",
        "code": "E01",
        "name": "Amorsare tavan — un strat — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.59,
        "unit_price": 20,
        "total": 32,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "antreu",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.59,
        "unit_price": 145,
        "total": 231,
        "option": false,
        "comment": "pe ml — orientativ 10 %, se măsoară la fața locului"
      },
      {
        "room": "living_bucatarie",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton)",
        "um": "m²",
        "qty": 36.25,
        "unit_price": 30,
        "total": 1088,
        "option": false,
        "comment": "pardoseală + mobilier rămas"
      },
      {
        "room": "living_bucatarie",
        "code": "I04",
        "name": "Trasare circuite electrice (canale, tuburi, doze)",
        "um": "punct",
        "qty": 4,
        "unit_price": 350,
        "total": 1400,
        "option": false,
        "comment": "priză+cablu canal H1200, priză H300, corp aplicat (se schimbă), prize demontate"
      },
      {
        "room": "living_bucatarie",
        "code": "I01",
        "name": "Șanțare pereți / podea, material altul decât beton, lățime ≤ 6 cm",
        "um": "ml",
        "qty": 10,
        "unit_price": 80,
        "total": 800,
        "option": false,
        "comment": "șanțuri cabluri noi — nu în pardoseala cu încălzire"
      },
      {
        "room": "living_bucatarie",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 20,
        "unit_price": 80,
        "total": 1600,
        "option": false,
        "comment": "trasee cablu în tub"
      },
      {
        "room": "living_bucatarie",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 4,
        "unit_price": 70,
        "total": 280,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "H16",
        "name": "Blocare priză / doză veche",
        "um": "buc",
        "qty": 2,
        "unit_price": 150,
        "total": 300,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "H01",
        "name": "Priză — montaj complet, cu doză",
        "um": "buc",
        "qty": 2,
        "unit_price": 350,
        "total": 700,
        "option": false,
        "comment": "prize noi / mutate"
      },
      {
        "room": "living_bucatarie",
        "code": "H03",
        "name": "Demontare + montare priză existentă",
        "um": "buc",
        "qty": 8,
        "unit_price": 80,
        "total": 640,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "H04",
        "name": "Demontare + montare întrerupător existent",
        "um": "buc",
        "qty": 3,
        "unit_price": 80,
        "total": 240,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "H15",
        "name": "Demontare și remontare spot existent",
        "um": "buc",
        "qty": 20,
        "unit_price": 80,
        "total": 1600,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "H06",
        "name": "Corp suspendat / aplică",
        "um": "buc",
        "qty": 1,
        "unit_price": 400,
        "total": 400,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "H08",
        "name": "Bandă LED 24V (instalare + sudare)",
        "um": "ml",
        "qty": 7,
        "unit_price": 115,
        "total": 805,
        "option": false,
        "comment": "bandă LED nișă tavan"
      },
      {
        "room": "living_bucatarie",
        "code": "H09",
        "name": "Transformator / bloc alimentare LED",
        "um": "set",
        "qty": 1,
        "unit_price": 230,
        "total": 230,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D05",
        "name": "Glet finish — strat 1",
        "um": "m²",
        "qty": 2.8,
        "unit_price": 65,
        "total": 182,
        "option": false,
        "comment": "glet local — orientativ 10 %"
      },
      {
        "room": "living_bucatarie",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere",
        "um": "m²",
        "qty": 28,
        "unit_price": 30,
        "total": 840,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D01",
        "name": "Amorsare pereți — un strat",
        "um": "m²",
        "qty": 28,
        "unit_price": 20,
        "total": 560,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi",
        "um": "m²",
        "qty": 28,
        "unit_price": 145,
        "total": 4060,
        "option": false,
        "comment": "vopsea decorativă STO (F-1)"
      },
      {
        "room": "living_bucatarie",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 36.25,
        "unit_price": 30,
        "total": 1088,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 36.25,
        "unit_price": 20,
        "total": 725,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 36.25,
        "unit_price": 145,
        "total": 5256,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "C01",
        "name": "Perete despărțitor GKL (CW75, 1×12,5)",
        "um": "m²",
        "qty": 20,
        "unit_price": 215,
        "total": 4300,
        "option": false,
        "comment": "construcție GKL H=2630 deasupra bucătăriei 4,065 m + coloană 0,6×1,965 m"
      },
      {
        "room": "living_bucatarie",
        "code": "C11",
        "name": "Astupare rosturi",
        "um": "m²",
        "qty": 20,
        "unit_price": 140,
        "total": 2800,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "C12",
        "name": "Armare rosturi",
        "um": "m²",
        "qty": 20,
        "unit_price": 140,
        "total": 2800,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "C13",
        "name": "Șlefuire rosturi",
        "um": "m²",
        "qty": 20,
        "unit_price": 25,
        "total": 500,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "C14",
        "name": "Amorsare rosturi",
        "um": "m²",
        "qty": 20,
        "unit_price": 25,
        "total": 500,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "A25",
        "name": "Demontare faianță / gresie de pe pereți (băi)",
        "um": "m²",
        "qty": 15,
        "unit_price": 150,
        "total": 2250,
        "option": false,
        "comment": "teracotă existentă — cât se montează, atât se demontează (aprox.)"
      },
      {
        "room": "living_bucatarie",
        "code": "D13",
        "name": "Faianță 120×60",
        "um": "m²",
        "qty": 15,
        "unit_price": 500,
        "total": 7500,
        "option": false,
        "comment": "F-3 60×120: panou bucătărie ~5 m² + placare perete/coloană ~10 m²"
      },
      {
        "room": "living_bucatarie",
        "code": "D14",
        "name": "Faianță 120×120",
        "um": "m²",
        "qty": 5,
        "unit_price": 800,
        "total": 4000,
        "option": false,
        "comment": "F-5 120×120 — perete living (5 buc borderou)"
      },
      {
        "room": "living_bucatarie",
        "code": "D16",
        "name": "Tăiere la 45° — fiecare latură separat",
        "um": "ml",
        "qty": 4,
        "unit_price": 600,
        "total": 2400,
        "option": false,
        "comment": "colțuri placări"
      },
      {
        "room": "living_bucatarie",
        "code": "I13",
        "name": "Punct apă rece / caldă",
        "um": "buc",
        "qty": 3,
        "unit_price": 480,
        "total": 1440,
        "option": false,
        "comment": "chiuvetă 2, mașină vase 1"
      },
      {
        "room": "living_bucatarie",
        "code": "I14",
        "name": "Punct canalizare",
        "um": "buc",
        "qty": 2,
        "unit_price": 480,
        "total": 960,
        "option": false,
        "comment": "chiuvetă, mașină vase"
      },
      {
        "room": "living_bucatarie",
        "code": "S10",
        "name": "Chiuvetă bucătărie + tocător",
        "um": "set",
        "qty": 1,
        "unit_price": 960,
        "total": 960,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "S09",
        "name": "Racord mașină spălat / vase / uscător",
        "um": "set",
        "qty": 1,
        "unit_price": 2500,
        "total": 2500,
        "option": false,
        "comment": "mașină de spălat vase"
      },
      {
        "room": "living_bucatarie",
        "code": "A06",
        "name": "Protejare suprafețe — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3.62,
        "unit_price": 30,
        "total": 109,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D05",
        "name": "Glet finish — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.28,
        "unit_price": 65,
        "total": 18,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D07",
        "name": "Șlefuire pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.8,
        "unit_price": 30,
        "total": 84,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D01",
        "name": "Amorsare pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.8,
        "unit_price": 20,
        "total": 56,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D09",
        "name": "Vopsire finală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.8,
        "unit_price": 145,
        "total": 406,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3.62,
        "unit_price": 30,
        "total": 109,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3.62,
        "unit_price": 20,
        "total": 72,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3.62,
        "unit_price": 145,
        "total": 525,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "A25",
        "name": "Demontare faianță — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.5,
        "unit_price": 150,
        "total": 225,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D13",
        "name": "Faianță 120×60 — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.5,
        "unit_price": 500,
        "total": 750,
        "option": false
      },
      {
        "room": "living_bucatarie",
        "code": "D14",
        "name": "Faianță 120×120 — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.5,
        "unit_price": 800,
        "total": 400,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton)",
        "um": "m²",
        "qty": 25.59,
        "unit_price": 30,
        "total": 768,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "I04",
        "name": "Trasare circuite electrice",
        "um": "punct",
        "qty": 5,
        "unit_price": 350,
        "total": 1750,
        "option": false,
        "comment": "2 aplice H800, LED element decorativ, tavan extensibil, întrerupător+priză H500"
      },
      {
        "room": "dormitor_matrimonial",
        "code": "I01",
        "name": "Șanțare pereți / podea",
        "um": "ml",
        "qty": 12,
        "unit_price": 80,
        "total": 960,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 25,
        "unit_price": 80,
        "total": 2000,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 5,
        "unit_price": 70,
        "total": 350,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "H16",
        "name": "Blocare priză / doză veche",
        "um": "buc",
        "qty": 2,
        "unit_price": 150,
        "total": 300,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "H01",
        "name": "Priză — montaj complet, cu doză",
        "um": "buc",
        "qty": 1,
        "unit_price": 350,
        "total": 350,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "H02",
        "name": "Întrerupător — montaj complet, cu doză",
        "um": "buc",
        "qty": 1,
        "unit_price": 350,
        "total": 350,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "H03",
        "name": "Demontare + montare priză existentă",
        "um": "buc",
        "qty": 5,
        "unit_price": 80,
        "total": 400,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "H04",
        "name": "Demontare + montare întrerupător existent",
        "um": "buc",
        "qty": 2,
        "unit_price": 80,
        "total": 160,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "H15",
        "name": "Demontare și remontare spot existent",
        "um": "buc",
        "qty": 12,
        "unit_price": 80,
        "total": 960,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "H06",
        "name": "Corp suspendat / aplică",
        "um": "buc",
        "qty": 2,
        "unit_price": 400,
        "total": 800,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D05",
        "name": "Glet finish — strat 1",
        "um": "m²",
        "qty": 3.6,
        "unit_price": 65,
        "total": 234,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere",
        "um": "m²",
        "qty": 36,
        "unit_price": 30,
        "total": 1080,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D01",
        "name": "Amorsare pereți — un strat",
        "um": "m²",
        "qty": 36,
        "unit_price": 20,
        "total": 720,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi",
        "um": "m²",
        "qty": 36,
        "unit_price": 145,
        "total": 5220,
        "option": false,
        "comment": "vopsea decorativă STO (F-1)"
      },
      {
        "room": "dormitor_matrimonial",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 25.59,
        "unit_price": 30,
        "total": 768,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 25.59,
        "unit_price": 20,
        "total": 512,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 25.59,
        "unit_price": 145,
        "total": 3711,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "A06",
        "name": "Protejare — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.56,
        "unit_price": 30,
        "total": 77,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D05",
        "name": "Glet finish — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.36,
        "unit_price": 65,
        "total": 23,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D07",
        "name": "Șlefuire pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3.6,
        "unit_price": 30,
        "total": 108,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D01",
        "name": "Amorsare pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3.6,
        "unit_price": 20,
        "total": 72,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "D09",
        "name": "Vopsire finală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 3.6,
        "unit_price": 145,
        "total": 522,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.56,
        "unit_price": 30,
        "total": 77,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.56,
        "unit_price": 20,
        "total": 51,
        "option": false
      },
      {
        "room": "dormitor_matrimonial",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.56,
        "unit_price": 145,
        "total": 371,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton)",
        "um": "m²",
        "qty": 17.31,
        "unit_price": 30,
        "total": 519,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "I04",
        "name": "Trasare circuite electrice",
        "um": "punct",
        "qty": 6,
        "unit_price": 350,
        "total": 2100,
        "option": false,
        "comment": "2 aplice H800/1500, priză+cablu canal H1200, prize H850, internet H500"
      },
      {
        "room": "dormitor",
        "code": "I01",
        "name": "Șanțare pereți / podea",
        "um": "ml",
        "qty": 12,
        "unit_price": 80,
        "total": 960,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 25,
        "unit_price": 80,
        "total": 2000,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 6,
        "unit_price": 70,
        "total": 420,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "H16",
        "name": "Blocare priză / doză veche",
        "um": "buc",
        "qty": 2,
        "unit_price": 150,
        "total": 300,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "H01",
        "name": "Priză — montaj complet, cu doză",
        "um": "buc",
        "qty": 4,
        "unit_price": 350,
        "total": 1400,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "H03",
        "name": "Demontare + montare priză existentă",
        "um": "buc",
        "qty": 5,
        "unit_price": 80,
        "total": 400,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "H04",
        "name": "Demontare + montare întrerupător existent",
        "um": "buc",
        "qty": 2,
        "unit_price": 80,
        "total": 160,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "H15",
        "name": "Demontare și remontare spot existent",
        "um": "buc",
        "qty": 8,
        "unit_price": 80,
        "total": 640,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "H06",
        "name": "Corp suspendat / aplică",
        "um": "buc",
        "qty": 2,
        "unit_price": 400,
        "total": 800,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D05",
        "name": "Glet finish — strat 1",
        "um": "m²",
        "qty": 2.7,
        "unit_price": 65,
        "total": 176,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere",
        "um": "m²",
        "qty": 27,
        "unit_price": 30,
        "total": 810,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D01",
        "name": "Amorsare pereți — un strat",
        "um": "m²",
        "qty": 27,
        "unit_price": 20,
        "total": 540,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi",
        "um": "m²",
        "qty": 27,
        "unit_price": 145,
        "total": 3915,
        "option": false,
        "comment": "vopsea decorativă STO (F-1)"
      },
      {
        "room": "dormitor",
        "code": "D11",
        "name": "Tapet / fototapet",
        "um": "m²",
        "qty": 7,
        "unit_price": 145,
        "total": 1015,
        "option": false,
        "comment": "tapet F-2 — 7 m² (borderou); prețul este manoperă, nu materialul"
      },
      {
        "room": "dormitor",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 17.31,
        "unit_price": 30,
        "total": 519,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 17.31,
        "unit_price": 20,
        "total": 346,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 17.31,
        "unit_price": 145,
        "total": 2510,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "A06",
        "name": "Protejare — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.73,
        "unit_price": 30,
        "total": 52,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D05",
        "name": "Glet finish — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.27,
        "unit_price": 65,
        "total": 18,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D07",
        "name": "Șlefuire pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.7,
        "unit_price": 30,
        "total": 81,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D01",
        "name": "Amorsare pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.7,
        "unit_price": 20,
        "total": 54,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "D09",
        "name": "Vopsire finală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.7,
        "unit_price": 145,
        "total": 392,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.73,
        "unit_price": 30,
        "total": 52,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.73,
        "unit_price": 20,
        "total": 35,
        "option": false
      },
      {
        "room": "dormitor",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.73,
        "unit_price": 145,
        "total": 251,
        "option": false
      },
      {
        "room": "baie",
        "code": "G11",
        "name": "Oglindă cu LED",
        "um": "buc",
        "qty": 1,
        "unit_price": 800,
        "total": 800,
        "option": false,
        "comment": "manoperă montaj; oglinda e și în oferta de mobilier Baie 1"
      },
      {
        "room": "baie",
        "code": "A15",
        "name": "Demontare pardoseală existentă (gresie / parchet)",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 120,
        "total": 560,
        "option": false
      },
      {
        "room": "baie",
        "code": "A25",
        "name": "Demontare faianță / gresie de pe pereți (băi)",
        "um": "m²",
        "qty": 21.9,
        "unit_price": 150,
        "total": 3285,
        "option": false
      },
      {
        "room": "baie",
        "code": "A16",
        "name": "Spargere șapă / beton",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 120,
        "total": 560,
        "option": false,
        "comment": "pentru repoziționarea scurgerilor (duș la nivel pardoseală / WC)"
      },
      {
        "room": "baie",
        "code": "B05",
        "name": "Amorsare 1 — betokontakt pe zidărie brută",
        "um": "m²",
        "qty": 21.9,
        "unit_price": 25,
        "total": 548,
        "option": false
      },
      {
        "room": "baie",
        "code": "B06",
        "name": "Tencuială / nivelare pereți (Rotband, mecanizată)",
        "um": "m²",
        "qty": 21.9,
        "unit_price": 205,
        "total": 4490,
        "option": false
      },
      {
        "room": "baie",
        "code": "B08",
        "name": "Amorsare podea 1 (înainte de șapă)",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 20,
        "total": 93,
        "option": false
      },
      {
        "room": "baie",
        "code": "B10",
        "name": "Șapă semiuscată până la 10 cm",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 180,
        "total": 841,
        "option": false
      },
      {
        "room": "baie",
        "code": "B11",
        "name": "Hidroizolație băi / zone umede, 2 straturi",
        "um": "m²",
        "qty": 12.33,
        "unit_price": 120,
        "total": 1480,
        "option": false,
        "comment": "pardoseală + 30 cm pe pereți + zona dușului"
      },
      {
        "room": "baie",
        "code": "B12",
        "name": "Bandă de etanșare pe racorduri și colțuri",
        "um": "ml",
        "qty": 12.64,
        "unit_price": 100,
        "total": 1264,
        "option": false
      },
      {
        "room": "baie",
        "code": "I10",
        "name": "Țeavă metaloplast apă rece / caldă",
        "um": "ml",
        "qty": 18,
        "unit_price": 80,
        "total": 1440,
        "option": false
      },
      {
        "room": "baie",
        "code": "I11",
        "name": "Țeavă canalizare Ø50",
        "um": "ml",
        "qty": 6,
        "unit_price": 70,
        "total": 420,
        "option": false
      },
      {
        "room": "baie",
        "code": "I12",
        "name": "Țeavă canalizare Ø110",
        "um": "ml",
        "qty": 2,
        "unit_price": 120,
        "total": 240,
        "option": false
      },
      {
        "room": "baie",
        "code": "I01",
        "name": "Șanțare pereți / podea (țevi)",
        "um": "ml",
        "qty": 12,
        "unit_price": 80,
        "total": 960,
        "option": false
      },
      {
        "room": "baie",
        "code": "D13",
        "name": "Faianță 120×60",
        "um": "m²",
        "qty": 21.9,
        "unit_price": 500,
        "total": 10950,
        "option": false,
        "comment": "gresie porțelanată 60×120 Memory Marfil / RLV, până la tavan"
      },
      {
        "room": "baie",
        "code": "D16",
        "name": "Tăiere la 45° — fiecare latură separat",
        "um": "ml",
        "qty": 5,
        "unit_price": 600,
        "total": 3000,
        "option": false
      },
      {
        "room": "baie",
        "code": "D17",
        "name": "Gaură în gresie Ø ≤ 10 cm",
        "um": "buc",
        "qty": 8,
        "unit_price": 120,
        "total": 960,
        "option": false
      },
      {
        "room": "baie",
        "code": "F04",
        "name": "Gresie 300×300 / 600×600",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 600,
        "total": 2802,
        "option": false,
        "comment": "gresie pardoseală 60×120"
      },
      {
        "room": "baie",
        "code": "F05",
        "name": "Fugă epoxidică pardoseală",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 200,
        "total": 934,
        "option": false
      },
      {
        "room": "baie",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 20,
        "total": 93,
        "option": false
      },
      {
        "room": "baie",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 30,
        "total": 140,
        "option": false
      },
      {
        "room": "baie",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 4.67,
        "unit_price": 145,
        "total": 677,
        "option": false
      },
      {
        "room": "baie",
        "code": "I04",
        "name": "Trasare circuite electrice",
        "um": "punct",
        "qty": 6,
        "unit_price": 350,
        "total": 2100,
        "option": false,
        "comment": "LED oglindă, mașină spălat H1100, 4 spoturi noi"
      },
      {
        "room": "baie",
        "code": "I01",
        "name": "Șanțare pereți / podea (electric)",
        "um": "ml",
        "qty": 8,
        "unit_price": 80,
        "total": 640,
        "option": false
      },
      {
        "room": "baie",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 20,
        "unit_price": 80,
        "total": 1600,
        "option": false
      },
      {
        "room": "baie",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 3,
        "unit_price": 70,
        "total": 210,
        "option": false
      },
      {
        "room": "baie",
        "code": "H01",
        "name": "Priză — montaj complet, cu doză",
        "um": "buc",
        "qty": 2,
        "unit_price": 350,
        "total": 700,
        "option": false,
        "comment": "mașină spălat, lavoar"
      },
      {
        "room": "baie",
        "code": "H02",
        "name": "Întrerupător — montaj complet, cu doză",
        "um": "buc",
        "qty": 1,
        "unit_price": 350,
        "total": 350,
        "option": false
      },
      {
        "room": "baie",
        "code": "H05",
        "name": "Spot în rigips",
        "um": "buc",
        "qty": 4,
        "unit_price": 250,
        "total": 1000,
        "option": false,
        "comment": "spoturi IP65 noi DK/EU-3103-BK"
      },
      {
        "room": "baie",
        "code": "B01",
        "name": "Zidărie BCA 130 mm",
        "um": "m²",
        "qty": 3.5,
        "unit_price": 420,
        "total": 1470,
        "option": false,
        "comment": "pereți noi nișa mașinii de spălat (planșa 6: 355 + 900 mm)"
      },
      {
        "room": "baie",
        "code": "I13",
        "name": "Punct apă rece / caldă",
        "um": "buc",
        "qty": 5,
        "unit_price": 480,
        "total": 2400,
        "option": false,
        "comment": "lavoar 2, duș 2, mașină spălat 1"
      },
      {
        "room": "baie",
        "code": "I14",
        "name": "Punct canalizare",
        "um": "buc",
        "qty": 3,
        "unit_price": 480,
        "total": 1440,
        "option": false,
        "comment": "lavoar, duș, mașină spălat"
      },
      {
        "room": "baie",
        "code": "I16",
        "name": "Baterie duș încastrată",
        "um": "buc",
        "qty": 1,
        "unit_price": 1000,
        "total": 1000,
        "option": false,
        "comment": "coloană duș din perete"
      },
      {
        "room": "baie",
        "code": "S01",
        "name": "Lavoar + racord",
        "um": "buc",
        "qty": 1,
        "unit_price": 960,
        "total": 960,
        "option": false,
        "comment": "lavoar încastrat în blat"
      },
      {
        "room": "baie",
        "code": "S05",
        "name": "Baterie lavoar",
        "um": "buc",
        "qty": 1,
        "unit_price": 360,
        "total": 360,
        "option": false,
        "comment": "baterie pe blat"
      },
      {
        "room": "baie",
        "code": "S06",
        "name": "Baterie duș + pălărie",
        "um": "buc",
        "qty": 1,
        "unit_price": 480,
        "total": 480,
        "option": false,
        "comment": "set duș + pălărie H=2200"
      },
      {
        "room": "baie",
        "code": "S07",
        "name": "Supliment baterie încastrată în perete (lavoar sau duș)",
        "um": "buc",
        "qty": 1,
        "unit_price": 1000,
        "total": 1000,
        "option": false,
        "comment": "supliment baterie duș încastrată"
      },
      {
        "room": "baie",
        "code": "S04",
        "name": "Trap duș",
        "um": "buc",
        "qty": 1,
        "unit_price": 800,
        "total": 800,
        "option": false
      },
      {
        "room": "baie",
        "code": "F06",
        "name": "Padon scurgere duș din gresie",
        "um": "buc",
        "qty": 1,
        "unit_price": 4000,
        "total": 4000,
        "option": false,
        "comment": "padon duș din gresie, scurgere la nivel"
      },
      {
        "room": "baie",
        "code": "G05",
        "name": "Panou sticlă duș + ușă",
        "um": "buc",
        "qty": 1,
        "unit_price": 4000,
        "total": 4000,
        "option": false,
        "comment": "manoperă montaj; produsul de sticlă nu are ofertă de preț în documente"
      },
      {
        "room": "baie",
        "code": "S09",
        "name": "Racord mașină spălat / vase / uscător",
        "um": "set",
        "qty": 1,
        "unit_price": 2500,
        "total": 2500,
        "option": false,
        "comment": "mașină de spălat + uscat (în dulap)"
      },
      {
        "room": "baie",
        "code": "I17",
        "name": "Montare pardoseală caldă electrică",
        "um": "m²",
        "qty": 4,
        "unit_price": 360,
        "total": null,
        "option": true,
        "comment": "OPȚIUNE — pardoseală caldă electrică baie"
      },
      {
        "room": "baie",
        "code": "D19",
        "name": "Fugă epoxidică",
        "um": "m²",
        "qty": 21.9,
        "unit_price": 200,
        "total": null,
        "option": true,
        "comment": "OPȚIUNE — fugă epoxidică pe pereți"
      },
      {
        "room": "baie",
        "code": "A25",
        "name": "Demontare faianță — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.19,
        "unit_price": 150,
        "total": 328,
        "option": false
      },
      {
        "room": "baie",
        "code": "B06",
        "name": "Tencuială / nivelare — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.19,
        "unit_price": 205,
        "total": 449,
        "option": false
      },
      {
        "room": "baie",
        "code": "B11",
        "name": "Hidroizolație — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.23,
        "unit_price": 120,
        "total": 148,
        "option": false
      },
      {
        "room": "baie",
        "code": "D13",
        "name": "Faianță 120×60 — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.19,
        "unit_price": 500,
        "total": 1095,
        "option": false
      },
      {
        "room": "baie",
        "code": "F04",
        "name": "Gresie pardoseală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.47,
        "unit_price": 600,
        "total": 282,
        "option": false
      },
      {
        "room": "baie",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.47,
        "unit_price": 20,
        "total": 9,
        "option": false
      },
      {
        "room": "baie",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.47,
        "unit_price": 30,
        "total": 14,
        "option": false
      },
      {
        "room": "baie",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.47,
        "unit_price": 145,
        "total": 68,
        "option": false
      },
      {
        "room": "gts",
        "code": "G11",
        "name": "Oglindă cu LED",
        "um": "buc",
        "qty": 1,
        "unit_price": 800,
        "total": 800,
        "option": false,
        "comment": "manoperă montaj; oglinda e și în oferta de mobilier Baie 2"
      },
      {
        "room": "gts",
        "code": "A15",
        "name": "Demontare pardoseală existentă",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 120,
        "total": 253,
        "option": false
      },
      {
        "room": "gts",
        "code": "A25",
        "name": "Demontare faianță / gresie de pe pereți",
        "um": "m²",
        "qty": 16.5,
        "unit_price": 150,
        "total": 2475,
        "option": false
      },
      {
        "room": "gts",
        "code": "A16",
        "name": "Spargere șapă / beton",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 120,
        "total": 253,
        "option": false
      },
      {
        "room": "gts",
        "code": "B05",
        "name": "Amorsare 1 — betokontakt pe zidărie brută",
        "um": "m²",
        "qty": 16.5,
        "unit_price": 25,
        "total": 412,
        "option": false
      },
      {
        "room": "gts",
        "code": "B06",
        "name": "Tencuială / nivelare pereți (Rotband, mecanizată)",
        "um": "m²",
        "qty": 16.5,
        "unit_price": 205,
        "total": 3382,
        "option": false
      },
      {
        "room": "gts",
        "code": "B08",
        "name": "Amorsare podea 1 (înainte de șapă)",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 20,
        "total": 42,
        "option": false
      },
      {
        "room": "gts",
        "code": "B10",
        "name": "Șapă semiuscată până la 10 cm",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 180,
        "total": 380,
        "option": false
      },
      {
        "room": "gts",
        "code": "B11",
        "name": "Hidroizolație băi / zone umede, 2 straturi",
        "um": "m²",
        "qty": 7.88,
        "unit_price": 120,
        "total": 946,
        "option": false
      },
      {
        "room": "gts",
        "code": "B12",
        "name": "Bandă de etanșare pe racorduri și colțuri",
        "um": "ml",
        "qty": 9.81,
        "unit_price": 100,
        "total": 981,
        "option": false
      },
      {
        "room": "gts",
        "code": "I10",
        "name": "Țeavă metaloplast apă rece / caldă",
        "um": "ml",
        "qty": 12,
        "unit_price": 80,
        "total": 960,
        "option": false
      },
      {
        "room": "gts",
        "code": "I11",
        "name": "Țeavă canalizare Ø50",
        "um": "ml",
        "qty": 4,
        "unit_price": 70,
        "total": 280,
        "option": false
      },
      {
        "room": "gts",
        "code": "I12",
        "name": "Țeavă canalizare Ø110",
        "um": "ml",
        "qty": 2,
        "unit_price": 120,
        "total": 240,
        "option": false
      },
      {
        "room": "gts",
        "code": "I01",
        "name": "Șanțare pereți / podea (țevi)",
        "um": "ml",
        "qty": 8,
        "unit_price": 80,
        "total": 640,
        "option": false,
        "comment": "șanțuri țevi (GTS: ocolire perete cald!)"
      },
      {
        "room": "gts",
        "code": "D13",
        "name": "Faianță 120×60",
        "um": "m²",
        "qty": 16.5,
        "unit_price": 500,
        "total": 8250,
        "option": false,
        "comment": "gresie porțelanată 60×120 Memory Marfil / RLV, până la tavan"
      },
      {
        "room": "gts",
        "code": "D16",
        "name": "Tăiere la 45° — fiecare latură separat",
        "um": "ml",
        "qty": 3,
        "unit_price": 600,
        "total": 1800,
        "option": false
      },
      {
        "room": "gts",
        "code": "D17",
        "name": "Gaură în gresie Ø ≤ 10 cm",
        "um": "buc",
        "qty": 6,
        "unit_price": 120,
        "total": 720,
        "option": false
      },
      {
        "room": "gts",
        "code": "F04",
        "name": "Gresie pardoseală",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 600,
        "total": 1266,
        "option": false
      },
      {
        "room": "gts",
        "code": "F05",
        "name": "Fugă epoxidică pardoseală",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 200,
        "total": 422,
        "option": false
      },
      {
        "room": "gts",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 20,
        "total": 42,
        "option": false
      },
      {
        "room": "gts",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 30,
        "total": 63,
        "option": false
      },
      {
        "room": "gts",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 2.11,
        "unit_price": 145,
        "total": 306,
        "option": false
      },
      {
        "room": "gts",
        "code": "I04",
        "name": "Trasare circuite electrice",
        "um": "punct",
        "qty": 2,
        "unit_price": 350,
        "total": 700,
        "option": false,
        "comment": "LED oglindă, întrerupător"
      },
      {
        "room": "gts",
        "code": "I01",
        "name": "Șanțare pereți / podea (electric)",
        "um": "ml",
        "qty": 4,
        "unit_price": 80,
        "total": 320,
        "option": false
      },
      {
        "room": "gts",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 8,
        "unit_price": 80,
        "total": 640,
        "option": false
      },
      {
        "room": "gts",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 1,
        "unit_price": 70,
        "total": 70,
        "option": false
      },
      {
        "room": "gts",
        "code": "H02",
        "name": "Întrerupător — montaj complet, cu doză",
        "um": "buc",
        "qty": 1,
        "unit_price": 350,
        "total": 350,
        "option": false
      },
      {
        "room": "gts",
        "code": "C01",
        "name": "Perete despărțitor GKL (CW75, 1×12,5)",
        "um": "m²",
        "qty": 1.5,
        "unit_price": 215,
        "total": 322,
        "option": false,
        "comment": "construcție GKL H=1200 pentru rezervorul WC (planșa 6: 965 mm)"
      },
      {
        "room": "gts",
        "code": "C11",
        "name": "Astupare rosturi",
        "um": "m²",
        "qty": 1.5,
        "unit_price": 140,
        "total": 210,
        "option": false
      },
      {
        "room": "gts",
        "code": "C12",
        "name": "Armare rosturi",
        "um": "m²",
        "qty": 1.5,
        "unit_price": 140,
        "total": 210,
        "option": false
      },
      {
        "room": "gts",
        "code": "C13",
        "name": "Șlefuire rosturi",
        "um": "m²",
        "qty": 1.5,
        "unit_price": 25,
        "total": 38,
        "option": false
      },
      {
        "room": "gts",
        "code": "C14",
        "name": "Amorsare rosturi",
        "um": "m²",
        "qty": 1.5,
        "unit_price": 25,
        "total": 38,
        "option": false
      },
      {
        "room": "gts",
        "code": "I13",
        "name": "Punct apă rece / caldă",
        "um": "buc",
        "qty": 5,
        "unit_price": 480,
        "total": 2400,
        "option": false,
        "comment": "lavoar 2, WC 1, duș igienic 2"
      },
      {
        "room": "gts",
        "code": "I14",
        "name": "Punct canalizare",
        "um": "buc",
        "qty": 2,
        "unit_price": 480,
        "total": 960,
        "option": false,
        "comment": "lavoar, WC"
      },
      {
        "room": "gts",
        "code": "I15",
        "name": "Rezervor încastrat WC",
        "um": "buc",
        "qty": 1,
        "unit_price": 1445,
        "total": 1445,
        "option": false,
        "comment": "rama ROCA DN 90/110"
      },
      {
        "room": "gts",
        "code": "S02",
        "name": "Vas WC suspendat pe rezervor încastrat",
        "um": "buc",
        "qty": 1,
        "unit_price": 1000,
        "total": 1000,
        "option": false,
        "comment": "vas WC suspendat MERIDIAN-N Rimless — în proiect; oferta Simplex e pe GAP"
      },
      {
        "room": "gts",
        "code": "S01",
        "name": "Lavoar + racord",
        "um": "buc",
        "qty": 1,
        "unit_price": 960,
        "total": 960,
        "option": false,
        "comment": "lavoar încastrat"
      },
      {
        "room": "gts",
        "code": "S05",
        "name": "Baterie lavoar",
        "um": "buc",
        "qty": 1,
        "unit_price": 360,
        "total": 360,
        "option": false,
        "comment": "baterie din perete"
      },
      {
        "room": "gts",
        "code": "S07",
        "name": "Supliment baterie încastrată în perete",
        "um": "buc",
        "qty": 1,
        "unit_price": 1000,
        "total": 1000,
        "option": false,
        "comment": "supliment baterie încastrată lavoar"
      },
      {
        "room": "gts",
        "code": "S11",
        "name": "Duș igienic — montaj + racord",
        "um": "buc",
        "qty": 1,
        "unit_price": 480,
        "total": 480,
        "option": false
      },
      {
        "room": "gts",
        "code": "I17",
        "name": "Montare pardoseală caldă electrică",
        "um": "m²",
        "qty": 1.8,
        "unit_price": 360,
        "total": null,
        "option": true,
        "comment": "OPȚIUNE — pardoseală caldă electrică GTS"
      },
      {
        "room": "gts",
        "code": "D19",
        "name": "Fugă epoxidică",
        "um": "m²",
        "qty": 16.5,
        "unit_price": 200,
        "total": null,
        "option": true,
        "comment": "OPȚIUNE — fugă epoxidică pe pereți"
      },
      {
        "room": "gts",
        "code": "A25",
        "name": "Demontare faianță — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.65,
        "unit_price": 150,
        "total": 248,
        "option": false
      },
      {
        "room": "gts",
        "code": "B06",
        "name": "Tencuială / nivelare — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.65,
        "unit_price": 205,
        "total": 338,
        "option": false
      },
      {
        "room": "gts",
        "code": "B11",
        "name": "Hidroizolație — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.79,
        "unit_price": 120,
        "total": 95,
        "option": false
      },
      {
        "room": "gts",
        "code": "D13",
        "name": "Faianță 120×60 — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.65,
        "unit_price": 500,
        "total": 825,
        "option": false
      },
      {
        "room": "gts",
        "code": "F04",
        "name": "Gresie pardoseală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.21,
        "unit_price": 600,
        "total": 126,
        "option": false
      },
      {
        "room": "gts",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.21,
        "unit_price": 20,
        "total": 4,
        "option": false
      },
      {
        "room": "gts",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.21,
        "unit_price": 30,
        "total": 6,
        "option": false
      },
      {
        "room": "gts",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.21,
        "unit_price": 145,
        "total": 30,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton)",
        "um": "m²",
        "qty": 8.76,
        "unit_price": 30,
        "total": 263,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "I04",
        "name": "Trasare circuite electrice",
        "um": "punct",
        "qty": 1,
        "unit_price": 350,
        "total": 350,
        "option": false,
        "comment": "LED rafturi"
      },
      {
        "room": "loggia_bucatarie",
        "code": "I01",
        "name": "Șanțare pereți / podea",
        "um": "ml",
        "qty": 3,
        "unit_price": 80,
        "total": 240,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 6,
        "unit_price": 80,
        "total": 480,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 1,
        "unit_price": 70,
        "total": 70,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "H03",
        "name": "Demontare + montare priză existentă",
        "um": "buc",
        "qty": 2,
        "unit_price": 80,
        "total": 160,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "H04",
        "name": "Demontare + montare întrerupător existent",
        "um": "buc",
        "qty": 1,
        "unit_price": 80,
        "total": 80,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "H15",
        "name": "Demontare și remontare spot existent",
        "um": "buc",
        "qty": 5,
        "unit_price": 80,
        "total": 400,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D05",
        "name": "Glet finish — strat 1",
        "um": "m²",
        "qty": 2.2,
        "unit_price": 65,
        "total": 143,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere",
        "um": "m²",
        "qty": 22,
        "unit_price": 30,
        "total": 660,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D01",
        "name": "Amorsare pereți — un strat",
        "um": "m²",
        "qty": 22,
        "unit_price": 20,
        "total": 440,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi",
        "um": "m²",
        "qty": 22,
        "unit_price": 145,
        "total": 3190,
        "option": false,
        "comment": "vopsea decorativă STO (F-1)"
      },
      {
        "room": "loggia_bucatarie",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 8.76,
        "unit_price": 30,
        "total": 263,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 8.76,
        "unit_price": 20,
        "total": 175,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 8.76,
        "unit_price": 145,
        "total": 1270,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "A06",
        "name": "Protejare — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.88,
        "unit_price": 30,
        "total": 26,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D05",
        "name": "Glet finish — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.22,
        "unit_price": 65,
        "total": 14,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D07",
        "name": "Șlefuire pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.2,
        "unit_price": 30,
        "total": 66,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D01",
        "name": "Amorsare pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.2,
        "unit_price": 20,
        "total": 44,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "D09",
        "name": "Vopsire finală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 2.2,
        "unit_price": 145,
        "total": 319,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.88,
        "unit_price": 30,
        "total": 26,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.88,
        "unit_price": 20,
        "total": 18,
        "option": false
      },
      {
        "room": "loggia_bucatarie",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.88,
        "unit_price": 145,
        "total": 128,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton)",
        "um": "m²",
        "qty": 5.68,
        "unit_price": 30,
        "total": 170,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "H03",
        "name": "Demontare + montare priză existentă",
        "um": "buc",
        "qty": 1,
        "unit_price": 80,
        "total": 80,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "H04",
        "name": "Demontare + montare întrerupător existent",
        "um": "buc",
        "qty": 1,
        "unit_price": 80,
        "total": 80,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "H15",
        "name": "Demontare și remontare spot existent",
        "um": "buc",
        "qty": 3,
        "unit_price": 80,
        "total": 240,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D05",
        "name": "Glet finish — strat 1",
        "um": "m²",
        "qty": 1.5,
        "unit_price": 65,
        "total": 98,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere",
        "um": "m²",
        "qty": 15,
        "unit_price": 30,
        "total": 450,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D01",
        "name": "Amorsare pereți — un strat",
        "um": "m²",
        "qty": 15,
        "unit_price": 20,
        "total": 300,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi",
        "um": "m²",
        "qty": 15,
        "unit_price": 145,
        "total": 2175,
        "option": false,
        "comment": "vopsea decorativă STO (F-1)"
      },
      {
        "room": "loggia_dormitor",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 5.68,
        "unit_price": 30,
        "total": 170,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 5.68,
        "unit_price": 20,
        "total": 114,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 5.68,
        "unit_price": 145,
        "total": 824,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "A06",
        "name": "Protejare — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.57,
        "unit_price": 30,
        "total": 17,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D05",
        "name": "Glet finish — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.15,
        "unit_price": 65,
        "total": 10,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D07",
        "name": "Șlefuire pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.5,
        "unit_price": 30,
        "total": 45,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D01",
        "name": "Amorsare pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.5,
        "unit_price": 20,
        "total": 30,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "D09",
        "name": "Vopsire finală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.5,
        "unit_price": 145,
        "total": 218,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.57,
        "unit_price": 30,
        "total": 17,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.57,
        "unit_price": 20,
        "total": 11,
        "option": false
      },
      {
        "room": "loggia_dormitor",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.57,
        "unit_price": 145,
        "total": 83,
        "option": false
      },
      {
        "room": "terasa",
        "code": "A06",
        "name": "Protejare suprafețe (folie / carton)",
        "um": "m²",
        "qty": 3.88,
        "unit_price": 30,
        "total": 116,
        "option": false
      },
      {
        "room": "terasa",
        "code": "I04",
        "name": "Trasare circuite electrice",
        "um": "punct",
        "qty": 1,
        "unit_price": 350,
        "total": 350,
        "option": false,
        "comment": "aplică exterior H2000"
      },
      {
        "room": "terasa",
        "code": "I01",
        "name": "Șanțare pereți / podea",
        "um": "ml",
        "qty": 3,
        "unit_price": 80,
        "total": 240,
        "option": false
      },
      {
        "room": "terasa",
        "code": "I05",
        "name": "Trasee cablu, doze, tuburi protecție",
        "um": "ml",
        "qty": 5,
        "unit_price": 80,
        "total": 400,
        "option": false
      },
      {
        "room": "terasa",
        "code": "I08",
        "name": "Doze pentru prize și întrerupătoare",
        "um": "buc",
        "qty": 1,
        "unit_price": 70,
        "total": 70,
        "option": false
      },
      {
        "room": "terasa",
        "code": "H06",
        "name": "Corp suspendat / aplică",
        "um": "buc",
        "qty": 1,
        "unit_price": 400,
        "total": 400,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D05",
        "name": "Glet finish — strat 1",
        "um": "m²",
        "qty": 1.2,
        "unit_price": 65,
        "total": 78,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D07",
        "name": "Șlefuire pereți — o trecere",
        "um": "m²",
        "qty": 12,
        "unit_price": 30,
        "total": 360,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D01",
        "name": "Amorsare pereți — un strat",
        "um": "m²",
        "qty": 12,
        "unit_price": 20,
        "total": 240,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D09",
        "name": "Vopsire finală — 2 straturi",
        "um": "m²",
        "qty": 12,
        "unit_price": 145,
        "total": 1740,
        "option": false,
        "comment": "vopsire exterior terasă, 2 straturi"
      },
      {
        "room": "terasa",
        "code": "E03",
        "name": "Șlefuire tavan — o trecere",
        "um": "m²",
        "qty": 3.88,
        "unit_price": 30,
        "total": 116,
        "option": false
      },
      {
        "room": "terasa",
        "code": "E01",
        "name": "Amorsare tavan — un strat",
        "um": "m²",
        "qty": 3.88,
        "unit_price": 20,
        "total": 78,
        "option": false
      },
      {
        "room": "terasa",
        "code": "E04",
        "name": "Vopsire tavan — 2 straturi",
        "um": "m²",
        "qty": 3.88,
        "unit_price": 145,
        "total": 563,
        "option": false
      },
      {
        "room": "terasa",
        "code": "A15",
        "name": "Demontare pardoseală existentă",
        "um": "m²",
        "qty": 4.5,
        "unit_price": 120,
        "total": 540,
        "option": false,
        "comment": "pardoseală terasă existentă — borderou 4,5 m²"
      },
      {
        "room": "terasa",
        "code": "B11",
        "name": "Hidroizolație, 2 straturi",
        "um": "m²",
        "qty": 4.5,
        "unit_price": 120,
        "total": 540,
        "option": false
      },
      {
        "room": "terasa",
        "code": "F04",
        "name": "Gresie pardoseală",
        "um": "m²",
        "qty": 4.5,
        "unit_price": 600,
        "total": 2700,
        "option": false,
        "comment": "gresie terasă 4,5 m² (borderou)"
      },
      {
        "room": "terasa",
        "code": "A06",
        "name": "Protejare — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.39,
        "unit_price": 30,
        "total": 12,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D05",
        "name": "Glet finish — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.12,
        "unit_price": 65,
        "total": 8,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D07",
        "name": "Șlefuire pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.2,
        "unit_price": 30,
        "total": 36,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D01",
        "name": "Amorsare pereți — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.2,
        "unit_price": 20,
        "total": 24,
        "option": false
      },
      {
        "room": "terasa",
        "code": "D09",
        "name": "Vopsire finală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 1.2,
        "unit_price": 145,
        "total": 174,
        "option": false
      },
      {
        "room": "terasa",
        "code": "E03",
        "name": "Șlefuire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.39,
        "unit_price": 30,
        "total": 12,
        "option": false
      },
      {
        "room": "terasa",
        "code": "E01",
        "name": "Amorsare tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.39,
        "unit_price": 20,
        "total": 8,
        "option": false
      },
      {
        "room": "terasa",
        "code": "E04",
        "name": "Vopsire tavan — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.39,
        "unit_price": 145,
        "total": 57,
        "option": false
      },
      {
        "room": "terasa",
        "code": "B11",
        "name": "Hidroizolație — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.45,
        "unit_price": 120,
        "total": 54,
        "option": false
      },
      {
        "room": "terasa",
        "code": "F04",
        "name": "Gresie pardoseală — pe ml (laturi ≤ 50 cm)",
        "um": "ml",
        "qty": 0.45,
        "unit_price": 600,
        "total": 270,
        "option": false
      }
    ],
    "room_notes": {
      "antreu": "pardoseală 15.92 m² · pereți finisaj 30.0 m² · tavan 15.92 m² · H 2.60 m · dulap glisant 4,1 m și panouri EGGER = fără vopsea; oglindă LED mobilier",
      "living_bucatarie": "pardoseală 36.25 m² · pereți finisaj 28.0 m² · tavan 36.25 m² · H 2.75 m · perete TV panou EGGER; bucătărie până la tavan; placări F-3/F-5",
      "dormitor_matrimonial": "pardoseală 25.59 m² · pereți finisaj 36.0 m² · tavan 25.59 m² · H 2.63 m · panou CLEAF 1,4 m și dulap = fără vopsea; tavan extensibil translucid 1,3 m² (terț)",
      "dormitor": "pardoseală 17.31 m² · pereți finisaj 27.0 m² · tavan 17.31 m² · H 2.63 m · tapet F-2 7 m² pe peretele patului; panouri EGGER",
      "baie": "pardoseală 4.67 m² · pereți finisaj 21.9 m² · tavan 4.67 m² · H 2.59 m · demontare totală; placare 60×120 până la tavan; duș cu padon din gresie",
      "gts": "pardoseală 2.11 m² · pereți finisaj 16.5 m² · tavan 2.11 m² · H 2.84 m · demontare totală; WC suspendat, lavoar încastrat; perete cald existent 1,0×1,5 m — atenție la șanțare",
      "loggia_bucatarie": "pardoseală 8.76 m² · pereți finisaj 22.0 m² · tavan 8.76 m² · H 2.63 m · spațiu vitrat, cu calorifer; nu e în borderoul de 101,85 m²",
      "loggia_dormitor": "pardoseală 5.68 m² · pereți finisaj 15.0 m² · tavan 5.68 m² · H 2.58 m · spațiu vitrat, cu calorifer; nu e în borderoul de 101,85 m²",
      "terasa": "pardoseală 3.88 m² · pereți finisaj 12.0 m² · tavan 3.88 m² · H 2.60 m · pardoseală terasă 4,5 m² (borderou); aplică exterior"
    }
  },
  "furniture": {
    "source": "Constantin - Pret Mobilier.pdf",
    "date": "2026-10-07",
    "title": "OFERTA MOBILIER",
    "vat": "nedeclarat",
    "total": 379000,
    "items": [
      {
        "id": "bucatarie",
        "name": "Bucătărie",
        "room": "living_bucatarie",
        "qty": 1,
        "price": 125000,
        "specs": [
          "Carcasa U702",
          "Fronturi AGT 3019",
          "Blat HPL",
          "Sertare Hettich Atira Antracit",
          "Balamale Hettich cu amortizare",
          "Deschideri Aventos HF + HK-XS",
          "Iluminare Led 3000k cald",
          "Organizator tacamuri",
          "Maner Gola negru",
          "Cos Gunoi Hettich incorporat",
          "Mecanism CokingAgent"
        ]
      },
      {
        "id": "antreu",
        "name": "Mobilier Antreu",
        "room": "antreu",
        "qty": 1,
        "price": 39000,
        "specs": [
          "Carcasa U702",
          "Fronturi SKIN Textil 6572",
          "Fronturi Egger H1386 St40",
          "Oglinda",
          "Sertare Hettich Quadro",
          "Mecanisme Usi Cupe",
          "Iluminare Led 3000k cald"
        ]
      },
      {
        "id": "living",
        "name": "Mobilier Living",
        "room": "living_bucatarie",
        "qty": 1,
        "price": 32000,
        "specs": [
          "Fronturi Egger H1386",
          "Balama Hettich",
          "Mecanism Push",
          "Mecanisme de coborire Duo"
        ]
      },
      {
        "id": "masa_rafturi",
        "name": "Masă + Rafturi",
        "room": "loggia_bucatarie",
        "qty": 1,
        "price": 6000,
        "specs": [
          "Fronturi Egger H1386",
          "Picior metalic vopsit negru"
        ],
        "mapping_note": "Atribuit loggiei bucătărie după fotografia din ofertă (birou lângă fereastră). Documentul nu scrie explicit încăperea."
      },
      {
        "id": "dormitor_mat_dulap",
        "name": "Mobilier Dormitor+Dulap",
        "room": "dormitor_matrimonial",
        "qty": 1,
        "price": 36000,
        "specs": [
          "Carcasa U702",
          "Fronturi Egger H1386 St40",
          "Topuri SKIN Textil 6572",
          "Sertare in dulap Hettich Quadro",
          "Bara aluminiu umerase",
          "Balamale Hettich",
          "Maner Tip L negru"
        ]
      },
      {
        "id": "tumba",
        "name": "Tumba",
        "room": "dormitor_matrimonial",
        "qty": 1,
        "price": 15000,
        "specs": [
          "Carcasa U702",
          "Fronturi Egger H1386 St40",
          "Sertare Hettich Quadro",
          "Topul SKIN Textil 6572"
        ],
        "mapping_note": "Atribuit dormitorului matrimonial după fotografia din ofertă (consolă + TV pe coridor). Documentul nu scrie explicit încăperea."
      },
      {
        "id": "dormitor2_birou",
        "name": "Mobilier Dormitor 2",
        "room": "dormitor",
        "qty": 1,
        "price": 36000,
        "specs": [
          "Carcasa U702",
          "Fronturi Egger H1386 St40",
          "Fronturi AGT 3019",
          "Sertare Hettich Quadro",
          "Balamale Hettich",
          "Manere rotunjite + vopsire",
          "Mecanism Push"
        ],
        "mapping_note": "Prima linie «Mobilier Dormitor 2» din ofertă (zonă birou / dulap, foto cu masă)."
      },
      {
        "id": "dormitor2_pat",
        "name": "Mobilier Dormitor 2",
        "room": "dormitor",
        "qty": 1,
        "price": 48000,
        "specs": [
          "Carcasa U702",
          "Fronturi Egger H1386 St40",
          "Sertare in dulap Hettich Quadro",
          "Bara aluminiu umerase",
          "Balamale Hettich",
          "Manere rotunjite + vopsire",
          "Manere Noptiere"
        ],
        "mapping_note": "A doua linie «Mobilier Dormitor 2» din ofertă (pat + noptiere + tapet F-2). Două linii cu același nume, prețuri diferite."
      },
      {
        "id": "baie1",
        "name": "Baie 1",
        "room": "baie",
        "qty": 1,
        "price": 20000,
        "specs": [
          "Carcasa U702",
          "Fronturi Egger H1386 St40",
          "Iluminare LED 3000K Cald",
          "Oglinda",
          "Sertare Hettich Atira",
          "Maner Gola negru"
        ]
      },
      {
        "id": "dulap_baie1",
        "name": "Dulap baie 1",
        "room": "baie",
        "qty": 1,
        "price": 11000,
        "specs": [
          "Carcasa U702",
          "Fronturi Egger H1386 St40",
          "Balamale Hettich",
          "Maner Frezat"
        ]
      },
      {
        "id": "baie2",
        "name": "Mobilier Baie 2",
        "room": "gts",
        "qty": 1,
        "price": 11000,
        "specs": [
          "Carcasa U702",
          "Fronturi Egger H1386 St40",
          "Iluminare LED 3000K Cald",
          "Oglinda",
          "Balamale Hettich",
          "Mecanism Push",
          "Rama metalica p/u fatada din gresie"
        ]
      }
    ]
  },
  "materials": {
    "project_quantities": {
      "source": "PROIECT FINAL_CLUB HOUSE.pdf planșa 2 și 18",
      "F-1_vopsea_sto_pereti_m2": 135,
      "vopsea_alba_tavan_m2": 98,
      "F-2_tapet_m2": 7,
      "F-3_memory_marfil_walls_buc": 89,
      "memory_marfil_total_buc": 101,
      "memory_marfil_total_m2": 73,
      "F-4_memory_marfil_rlv_buc": 12,
      "memory_marfil_rlv_m2": 9,
      "F-5_stratos_vein_white_buc": 5,
      "plinta_arbiton_stiq_s0611_ml_borderou_materiale": 45.5,
      "plinta_arbiton_stiq_s0611_ml_plan_pardosea": 45.3,
      "pardosea_terasa_m2": 4.5,
      "floor_memory_marfil_buc": 12,
      "note": "Suprafețele din proiect sunt fără rezervă. Rezerva o stabilește dirigintele de șantier."
    },
    "gresie_plitka": {
      "source": "Oferta comerciala-premium - SpaceDesign.pdf",
      "supplier": "SRL Company ABC / plitka.md",
      "date": "2026-10-13",
      "contact": "Victor 060 02 02 71",
      "items": [
        {
          "id": 7646,
          "name": "Gresie porțelanată Memory Marfil",
          "brand": "GEOTILES SPAIN",
          "size": "60x120 cm",
          "finish": "Mat",
          "unit_price": 599,
          "um": "m²",
          "qty_m2": 76.32,
          "total_before": 45715.68,
          "discount_pct": 5,
          "total_after": 43430,
          "stock": "In stoc",
          "url": "https://plitka.md/gresie-si-faianta/geotiles-spania-memory-memory-marfil-110051611",
          "rooms": [
            "baie",
            "gts",
            "living_bucatarie",
            "terasa"
          ],
          "note": "Oferta e pe tot obiectul, nu e spartă pe încăperi. În proiect: 101 buc / 73 m² (fără rezervă) + 4.5 m² terasă."
        },
        {
          "id": 6994,
          "name": "Gresie porțelanată Memory Marfil RLV",
          "brand": "GEOTILES SPAIN",
          "size": "60x120 cm",
          "finish": "Mat",
          "unit_price": 599,
          "um": "m²",
          "qty_m2": 10.08,
          "total_before": 6037.92,
          "discount_pct": 5,
          "total_after": 5736,
          "stock": "In stoc",
          "url": "https://plitka.md/gresie-si-faianta/geotiles-spania-memory-memory-marfil-rlv-6994",
          "rooms": [
            "baie"
          ],
          "note": "În proiect F-4: 12 buc / 9 m². 14 plăci × 0.72 m² = 10.08 m² (oferta include rezervă)."
        }
      ],
      "total_before_discount": 51753.6,
      "total_after_5pct": 49166,
      "missing_vs_project": "Stratos Vein White 5 buc — nu e în această ofertă"
    },
    "paint_sto": {
      "source": "19210.pdf",
      "type": "cont_de_plata",
      "number": "19210",
      "date": "2026-10-13",
      "supplier": "Tehnologii Inovatoare SRL (sto.md)",
      "payer": "Marjina Constantin",
      "items": [
        {
          "code": "00026-001",
          "name": "Y10 85 05 StoColor Opticryl Satinmatt white 15 L",
          "um": "gal",
          "qty": 2,
          "list_price": 5927.0,
          "discount_price": 5630.65,
          "total": 11261.3,
          "use": "pereți (Lista Constantin: Y108505)"
        },
        {
          "code": "00026-004",
          "name": "Y10 85 05 StoColor Opticryl Satinmatt white 5 L",
          "um": "gal",
          "qty": 1,
          "list_price": 2644.0,
          "discount_price": 2511.8,
          "total": 2511.8,
          "use": "pereți"
        },
        {
          "code": "00024-001",
          "name": "Y07 93 03 StoColor Opticryl Matt white 15 L",
          "um": "gal",
          "qty": 1,
          "list_price": 4613.0,
          "discount_price": 4382.35,
          "total": 4382.35,
          "use": "tavan (Lista Constantin: Y079303)"
        },
        {
          "code": "00024-005",
          "name": "Y07 93 03 StoColor Opticryl Matt white 10 L",
          "um": "gal",
          "qty": 1,
          "list_price": 3075.0,
          "discount_price": 2921.25,
          "total": 2921.25,
          "use": "tavan"
        },
        {
          "code": "00517-001",
          "name": "StoPrim Color white 15 L",
          "um": "gal",
          "qty": 2,
          "list_price": 3074.0,
          "discount_price": 2920.3,
          "total": 5840.6,
          "use": "amorsă; nu e linie separată în Lista Constantin"
        }
      ],
      "discount": 1416.7,
      "total_cu_tva": 26917.3,
      "tva": 4486.21,
      "valid_banking_days": 3
    },
    "plinta": {
      "source": "Lista Constantin.pdf",
      "name": "Arbiton STIQ S0611",
      "url": "https://dekora.md/ro/product/plinta-din-duropolimer-stiq-s0611",
      "qty": "24 buc.",
      "unit_price": 260,
      "total": 1040
    },
    "lighting_project_no_price": [
      {
        "name": "DK/EU-3103-BK, GU10, spot incastrat, IP65, negru, plastic, rotund",
        "qty": 4,
        "unit": "unități",
        "likely_room": "baie"
      },
      {
        "name": "Corp de iluminare aplicat",
        "qty": 1,
        "unit": "unitate"
      },
      {
        "name": "Aplice pe perete",
        "qty": 2,
        "unit": "unități"
      },
      {
        "name": "Aplice pe perete",
        "qty": 4,
        "unit": "unități"
      },
      {
        "name": "Aplice pe perete terasa",
        "qty": 1,
        "unit": "unitate",
        "likely_room": "terasa"
      }
    ],
    "sanitary_project_unpriced": [
      "Vas WC suspendat MERIDIAN-N Rimless, ROCA Spania — 1",
      "Rama ROCA pentru suspendarea WC (cot DN 90/110), ROCA Spania — 1",
      "Duș igienic — 1",
      "Baterie pentru lavoar — 1",
      "Baterie pentru lavoar — 1",
      "Set duș — 1"
    ]
  },
  "sanitary": {
    "source": "Oferta.Arnaut.Sebastian.Simplex.17.09.2026.pdf",
    "date": "2026-09-17",
    "manager": "Racovita Elena",
    "phone": "068537164",
    "email": "racovita.elena@simplex.md",
    "client_code": "c00313354",
    "items": [
      {
        "nr": 1,
        "name": "Rama Roca DUPLO S pentru suspendarea WC",
        "producer": "Roca Spania",
        "qty": 1,
        "unit_price": 4300,
        "total": 4300,
        "promo": false,
        "rooms": [
          "gts"
        ]
      },
      {
        "nr": 2,
        "name": "Clapeta dubla actionare PS3 DUPLO S, negru mat",
        "producer": "Roca Spania",
        "qty": 1,
        "unit_price": 1423,
        "total": 1423,
        "promo": false,
        "rooms": [
          "gts"
        ]
      },
      {
        "nr": 3,
        "name": "Vas WC suspendat GAP, Rimless",
        "producer": "Roca Spania",
        "qty": 1,
        "unit_price": 5500,
        "total": 5500,
        "promo": false,
        "rooms": [
          "gts"
        ],
        "note": "Proiectul de design cere MERIDIAN-N Rimless, nu GAP."
      },
      {
        "nr": 4,
        "name": "Capac WC GAP (Alegra) Slim, Soft Close",
        "producer": "Roca Spania",
        "qty": 1,
        "unit_price": 1613,
        "total": 1613,
        "promo": false,
        "rooms": [
          "gts"
        ]
      },
      {
        "nr": 5,
        "name": "Baterie SUVI dus igienic incorporat shut-off, negru mat",
        "producer": "Daniel Italia",
        "qty": 1,
        "unit_price": 2990,
        "total": 2990,
        "promo": true,
        "rooms": [
          "gts"
        ]
      },
      {
        "nr": 6,
        "name": "Boxa Daniel incorporata pt lavoar, piese separate",
        "producer": "Daniel Italia",
        "qty": 1,
        "unit_price": 6490,
        "total": 6490,
        "promo": false,
        "rooms": [
          "gts"
        ]
      },
      {
        "nr": 7,
        "name": "Baterie Tokyo lavoar pentru WBOX negru mat",
        "producer": "Daniel Italia",
        "qty": 1,
        "unit_price": 9492,
        "total": 9492,
        "promo": false,
        "rooms": [
          "gts"
        ]
      },
      {
        "nr": 8,
        "name": "Baterie SKYLINE lavoar, cu ventil negru mat",
        "producer": "Daniel Italia",
        "qty": 1,
        "unit_price": 4015,
        "total": 4015,
        "promo": true,
        "rooms": [
          "baie"
        ]
      },
      {
        "nr": 9,
        "name": "Set de dus TOKYO incorporat (2 piese), negru mat",
        "producer": "Daniel Italia",
        "qty": 1,
        "unit_price": 15853,
        "total": 15853,
        "promo": false,
        "rooms": [
          "baie"
        ]
      },
      {
        "nr": 10,
        "name": "Set TECE Linus 600 mm",
        "producer": "Tece Germania",
        "qty": 1,
        "unit_price": 5350,
        "total": 5350,
        "promo": false,
        "rooms": [
          "baie"
        ]
      },
      {
        "nr": 11,
        "name": "Membrana TECEDrainline antimiros pentru sifoane",
        "producer": "Tece Germania",
        "qty": 1,
        "unit_price": 290,
        "total": 290,
        "promo": false,
        "rooms": [
          "baie"
        ]
      },
      {
        "nr": 12,
        "name": "Sita par/impuritati TECEDrainline otel inox",
        "producer": "Tece Germania",
        "qty": 1,
        "unit_price": 393,
        "total": 393,
        "promo": false,
        "rooms": [
          "baie"
        ]
      }
    ],
    "line_sum": 57709,
    "printed_total": 61704,
    "printed_vs_lines_gap": 3995,
    "gap_note": "Totalul verde tipărit 61 704 nu este egal cu suma celor 12 linii (57 709). Diferența 3 995. Folosește suma liniilor până se clarifică cu Simplex."
  },
  "lista_constantin": {
    "source": "Lista Constantin.pdf",
    "role": "compilare — NU sursă primară de preț",
    "items": [
      {
        "category": "Plinta",
        "position": "Arbiton",
        "name": "S0611",
        "supplier": "dekora.md",
        "qty_text": "24 buc.",
        "unit_price": 260,
        "total": 1040,
        "duplicates": "doar aici ca preț de material; manoperă montaj e F13 în deviz (6 370)"
      },
      {
        "category": "Gresie",
        "position": "Baie",
        "name": "Memory Marfil RLV",
        "supplier": "plitka.md",
        "qty_text": "10.5 m2 / 14 buc.",
        "unit_price": 599,
        "total": 6289,
        "duplicates": "aceeași gresie ca oferta plitka.md 10.08 m², dar fără 5% reducere (oferta: 5 736)"
      },
      {
        "category": "Gresie",
        "position": "Baie",
        "name": "Memory Marfil",
        "supplier": "Plitka MD",
        "qty_text": "76 m2 / 106 buc.",
        "unit_price": 599,
        "total": 45524,
        "duplicates": "aceeași gresie ca oferta plitka.md 76.32 m², dar fără 5% reducere (oferta: 43 430)"
      },
      {
        "category": "Gresie",
        "position": "Baie",
        "name": "Stratos Vein White (URL); denumire greșită Memory Marfil în tabel",
        "supplier": "plitka.md",
        "qty_text": "7.2 m2 / 5buc.",
        "unit_price": 1049,
        "total": 7550,
        "duplicates": "NU e în oferta comercială plitka.md din 13.10.2026. În proiect F-5 living, 5 buc 120×120. Atribuit greșit la «Baie» în listă."
      },
      {
        "category": "Vopsea",
        "position": "Pereți",
        "name": "Y108505",
        "supplier": "STO",
        "qty_text": "140 m2",
        "unit_price": null,
        "total": 16770,
        "duplicates": "același produs ca factura 19210 (Satinmatt). Suma pereți+tavan din listă 26 913 ≈ factura 26 917.30"
      },
      {
        "category": "Vopsea",
        "position": "Tavan",
        "name": "Y079303",
        "supplier": "STO",
        "qty_text": "100 m2",
        "unit_price": null,
        "total": 10143,
        "duplicates": "același produs ca factura 19210 (Matt)"
      },
      {
        "category": "Sistem sanitar",
        "position": "Vas WC suspendat + sistem",
        "name": null,
        "supplier": "SIMPLEX",
        "qty_text": "1",
        "unit_price": null,
        "total": 12836,
        "duplicates": "agregat Simplex nr.1–4: 4 300+1 423+5 500+1 613=12 836"
      },
      {
        "category": "Sistem sanitar",
        "position": "Dus igienic",
        "name": null,
        "supplier": "SIMPLEX",
        "qty_text": "1",
        "unit_price": null,
        "total": 2990,
        "duplicates": "Simplex nr.5"
      },
      {
        "category": "Sistem sanitar",
        "position": "Baterie cada + dus",
        "name": null,
        "supplier": "SIMPLEX",
        "qty_text": "1",
        "unit_price": null,
        "total": 36603,
        "duplicates": "NU apare în oferta Simplex 17.09.2026. Proiectul are duș, nu cadă. Linie extra — nu o adăuga la total."
      },
      {
        "category": "Sistem sanitar",
        "position": "Trap dus 600mm",
        "name": null,
        "supplier": "SIMPLEX",
        "qty_text": "1",
        "unit_price": null,
        "total": 6033,
        "duplicates": "agregat Simplex nr.10–12: 5 350+290+393=6 033"
      },
      {
        "category": "Sistem sanitar",
        "position": "Sistem dus",
        "name": null,
        "supplier": "SIMPLEX",
        "qty_text": "1",
        "unit_price": null,
        "total": 15853,
        "duplicates": "Simplex nr.9"
      },
      {
        "category": "Sistem sanitar",
        "position": "Baterie lavoar",
        "name": null,
        "supplier": "SIMPLEX",
        "qty_text": "1",
        "unit_price": null,
        "total": 4015,
        "duplicates": "Simplex nr.8 SKYLINE"
      },
      {
        "category": "Sistem sanitar",
        "position": "Baterie lavoar",
        "name": null,
        "supplier": "SIMPLEX",
        "qty_text": "1",
        "unit_price": null,
        "total": 15982,
        "duplicates": "agregat Simplex nr.6+7: 6 490+9 492=15 982"
      }
    ],
    "use": "checklist; nu adăuga aceste sume peste ofertele furnizorilor"
  },
  "duplicates": [
    {
      "id": "DUP-GRES",
      "severity": "high",
      "what": "Gresia Memory Marfil și Memory Marfil RLV apare de 3 ori: proiect (cantități), oferta plitka.md (preț), Lista Constantin (preț fără reducerea de 5%).",
      "action": "Plătești o dată, după oferta plitka.md cu 5%: 49 166 lei. Nu adăuga și Lista Constantin."
    },
    {
      "id": "DUP-PAINT",
      "severity": "high",
      "what": "Vopseaua STO: proiect (135+98 m²), Lista Constantin (140+100 m² = 26 913), factura 19210 (26 917.30, în litri, include amorsă).",
      "action": "Sursă de plată: factura 19210 = 26 917.30 lei cu TVA."
    },
    {
      "id": "DUP-SAN",
      "severity": "high",
      "what": "Obiectele Simplex sunt detaliate în oferta 17.09.2026 și agregate în Lista Constantin. În plus Lista are «Baterie cada + dus» 36 603, inexistentă în ofertă și contradictorie cu proiectul (duș, nu cadă).",
      "action": "Sursă: Simplex. Suma liniilor 57 709. Ignoră 36 603 din listă. Cere lămurire pentru totalul tipărit 61 704."
    },
    {
      "id": "DUP-WC-MODEL",
      "severity": "medium",
      "what": "Proiect: vas WC MERIDIAN-N Rimless. Ofertă Simplex: GAP Rimless. Devizul de manoperă citează MERIDIAN-N.",
      "action": "Modele diferite. Confirmă cu designerul / Simplex ce se cumpără."
    },
    {
      "id": "DUP-TILE-QTY",
      "severity": "medium",
      "what": "Cantități gresie: proiect 101 buc/73 m² Marfil + 12 buc/9 m² RLV (fără rezervă) vs plitka 76.32 + 10.08 m² (cu rezervă, ≈106 și 14 plăci).",
      "action": "Diferența e rezerva de șantier, nu un al doilea set de gresie."
    },
    {
      "id": "DUP-STRATOS-ROOM",
      "severity": "medium",
      "what": "Lista Constantin pune Stratos Vein la «Baie». Proiectul F-5 o pune pe peretele livingului (5 buc 120×120).",
      "action": "Nu e gresie de baie. Nu e în oferta plitka.md din 13.10.2026 — lipsește o ofertă."
    },
    {
      "id": "DUP-SIMPLEX-TOTAL",
      "severity": "medium",
      "what": "În oferta Simplex, TOTAL tipărit 61 704 ≠ suma liniilor 57 709 (diferență 3 995).",
      "action": "Nu inventa restul. Întreabă Simplex. Până atunci folosește 57 709."
    },
    {
      "id": "DUP-FURN-NAME",
      "severity": "low",
      "what": "Două linii consecutive «Mobilier Dormitor 2» (36 000 și 48 000) — piese diferite, același nume.",
      "action": "Sunt două produse, nu un duplicat de preț. Ambele intră în totalul 379 000."
    },
    {
      "id": "DUP-MIRROR",
      "severity": "low",
      "what": "Oglindă LED: manoperă montaj G11 (800 lei × 2 încăperi) în deviz + oglinda inclusă în mobilier Baie 1 / Baie 2.",
      "action": "Nu e dublu produs; e montaj vs. produs. Nu scădea nimic fără confirmare."
    }
  ],
  "missing_prices": [
    "Corpuri de iluminat din borderoul proiectului (spoturi IP65, aplice, corp aplicat) — doar manoperă de montaj",
    "Material tapet F-2 (7 m²) — doar manoperă D11 1 015 lei",
    "Electrocasnice din planșa 7: aragaz, cuptor, cuptor cu microunde, frigider, mașină de spălat vase, mașină de spălat și uscat rufe",
    "Chiuvetă bucătărie (produs) — doar manoperă S10 960",
    "Panou sticlă duș (produs) — doar manoperă G05 4 000",
    "Lavoare (produs) — doar manoperă racord",
    "Uși (opțiune manoperă, fără preț de produs)",
    "Tavan extensibil translucid 1,3 m² în dormitorul matrimonial (notat «terț»)",
    "Stratos Vein White — preț doar în Lista Constantin (7 550), nu în oferta plitka.md"
  ],
  "unpriced_appliances_in_drawings": [
    "Aragaz",
    "Cuptor",
    "Cuptor cu microunde",
    "Frigider",
    "Mașină de spălat vase",
    "Mașină de spălat și uscat rufe",
    "Canapea",
    "Puf",
    "TV (3 locuri pe plan)",
    "Lampadar"
  ]
};
