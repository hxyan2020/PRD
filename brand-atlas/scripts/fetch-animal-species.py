#!/usr/bin/env python3
"""Fetch animal & insect species from Catalogue of Life (ChecklistBank dataset 3LR).

Guidance: major vertebrate and insect genera (parallel to tree/flower COL pipelines).
Writes scripts/data/col-animal-species.json and scripts/data/animal-seeds-col.json.
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

UA = {
    "User-Agent": "SeenBrandAtlas/1.0 (educational catalog; https://github.com/hxyan2020/PRD)"
}
ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data"
OUT.mkdir(parents=True, exist_ok=True)

# Genera with tags for silhouette / filtering
# tag: mammal | bird | reptile | amphibian | fish | insect | arachnid | mollusc | other
GENERA = {
    # Mammals — carnivores
    "Canis": "mammal", "Vulpes": "mammal", "Lycaon": "mammal", "Cuon": "mammal",
    "Ursus": "mammal", "Ailuropoda": "mammal", "Helarctos": "mammal", "Tremarctos": "mammal",
    "Melursus": "mammal", "Panthera": "mammal", "Puma": "mammal", "Acinonyx": "mammal",
    "Lynx": "mammal", "Felis": "mammal", "Leopardus": "mammal", "Neofelis": "mammal",
    "Crocuta": "mammal", "Hyaena": "mammal", "Proteles": "mammal",
    "Mustela": "mammal", "Martes": "mammal", "Gulo": "mammal", "Meles": "mammal",
    "Lutra": "mammal", "Enhydra": "mammal", "Mephitis": "mammal", "Taxidea": "mammal",
    "Procyon": "mammal", "Nasua": "mammal", "Ailurus": "mammal",
    # Primates
    "Homo": "mammal", "Pan": "mammal", "Gorilla": "mammal", "Pongo": "mammal",
    "Hylobates": "mammal", "Symphalangus": "mammal", "Macaca": "mammal", "Papio": "mammal",
    "Mandrillus": "mammal", "Theropithecus": "mammal", "Cercopithecus": "mammal",
    "Chlorocebus": "mammal", "Colobus": "mammal", "Presbytis": "mammal", "Trachypithecus": "mammal",
    "Nasalis": "mammal", "Alouatta": "mammal", "Ateles": "mammal", "Cebus": "mammal",
    "Saimiri": "mammal", "Callithrix": "mammal", "Saguinus": "mammal", "Lemur": "mammal",
    "Eulemur": "mammal", "Varecia": "mammal", "Propithecus": "mammal", "Daubentonia": "mammal",
    "Tarsius": "mammal", "Nycticebus": "mammal", "Loris": "mammal", "Galago": "mammal",
    # Ungulates
    "Equus": "mammal", "Tapirus": "mammal", "Rhinoceros": "mammal", "Diceros": "mammal",
    "Ceratotherium": "mammal", "Dicerorhinus": "mammal", "Elephas": "mammal", "Loxodonta": "mammal",
    "Bos": "mammal", "Bison": "mammal", "Bubalus": "mammal", "Syncerus": "mammal",
    "Boselaphus": "mammal", "Tragelaphus": "mammal", "Taurotragus": "mammal",
    "Ovis": "mammal", "Capra": "mammal", "Oreamnos": "mammal", "Rupicapra": "mammal",
    "Gazella": "mammal", "Antilope": "mammal", "Litocranius": "mammal", "Aepyceros": "mammal",
    "Connochaetes": "mammal", "Alcelaphus": "mammal", "Damaliscus": "mammal",
    "Cervus": "mammal", "Odocoileus": "mammal", "Alces": "mammal", "Rangifer": "mammal",
    "Capreolus": "mammal", "Dama": "mammal", "Muntiacus": "mammal", "Moschus": "mammal",
    "Giraffa": "mammal", "Okapia": "mammal", "Hippopotamus": "mammal", "Choeropsis": "mammal",
    "Sus": "mammal", "Phacochoerus": "mammal", "Potamochoerus": "mammal", "Babyrousa": "mammal",
    "Camelus": "mammal", "Lama": "mammal", "Vicugna": "mammal", "Alpaca": "mammal",
    # Marine mammals
    "Tursiops": "mammal", "Delphinus": "mammal", "Orcinus": "mammal", "Physeter": "mammal",
    "Balaenoptera": "mammal", "Megaptera": "mammal", "Eubalaena": "mammal", "Balaena": "mammal",
    "Phoca": "mammal", "Halichoerus": "mammal", "Mirounga": "mammal", "Hydrurga": "mammal",
    "Leptonychotes": "mammal", "Odobenus": "mammal", "Zalophus": "mammal", "Arctocephalus": "mammal",
    "Trichechus": "mammal", "Dugong": "mammal",
    # Rodents / lagomorphs / others
    "Mus": "mammal", "Rattus": "mammal", "Sciurus": "mammal", "Tamias": "mammal",
    "Marmota": "mammal", "Castor": "mammal", "Hystrix": "mammal", "Erethizon": "mammal",
    "Cavia": "mammal", "Hydrochoerus": "mammal", "Myocastor": "mammal", "Chinchilla": "mammal",
    "Lepus": "mammal", "Oryctolagus": "mammal", "Sylvilagus": "mammal",
    "Erinaceus": "mammal", "Talpa": "mammal", "Sorex": "mammal", "Desmana": "mammal",
    "Manis": "mammal", "Dasypus": "mammal", "Bradypus": "mammal", "Choloepus": "mammal",
    "Myrmecophaga": "mammal", "Tamandua": "mammal", "Orycteropus": "mammal",
    "Phascolarctos": "mammal", "Macropus": "mammal", "Osphranter": "mammal", "Wallabia": "mammal",
    "Dendrolagus": "mammal", "Vombatus": "mammal", "Lasiorhinus": "mammal", "Sarcophilus": "mammal",
    "Dasyurus": "mammal", "Thylacinus": "mammal", "Petaurus": "mammal", "Acrobates": "mammal",
    "Ornithorhynchus": "mammal", "Tachyglossus": "mammal", "Zaglossus": "mammal",
    "Procavia": "mammal", "Dendrohyrax": "mammal", "Elephantulus": "mammal",
    "Suricata": "mammal", "Mungos": "mammal", "Herpestes": "mammal", "Ichneumia": "mammal",
    "Genetta": "mammal", "Civettictis": "mammal", "Paradoxurus": "mammal", "Arctictis": "mammal",
    "Potos": "mammal", "Bassariscus": "mammal",
    # Bats
    "Pteropus": "mammal", "Rousettus": "mammal", "Desmodus": "mammal", "Myotis": "mammal",
    "Pipistrellus": "mammal", "Eptesicus": "mammal", "Rhinolophus": "mammal",
    # Birds — iconic genera
    "Aquila": "bird", "Haliaeetus": "bird", "Accipiter": "bird", "Buteo": "bird",
    "Falco": "bird", "Milvus": "bird", "Circus": "bird", "Pandion": "bird",
    "Gyps": "bird", "Vultur": "bird", "Cathartes": "bird", "Sarcoramphus": "bird",
    "Strix": "bird", "Bubo": "bird", "Tyto": "bird", "Athene": "bird", "Otus": "bird",
    "Asio": "bird", "Surnia": "bird",
    "Corvus": "bird", "Pica": "bird", "Garrulus": "bird", "Cyanocitta": "bird",
    "Parus": "bird", "Cyanistes": "bird", "Poecile": "bird", "Sitta": "bird",
    "Passer": "bird", "Fringilla": "bird", "Carduelis": "bird", "Spinus": "bird",
    "Serinus": "bird", "Emberiza": "bird", "Zonotrichia": "bird", "Melospiza": "bird",
    "Turdus": "bird", "Erithacus": "bird", "Luscinia": "bird", "Phoenicurus": "bird",
    "Saxicola": "bird", "Oenanthe": "bird", "Sturnus": "bird", "Acridotheres": "bird",
    "Hirundo": "bird", "Delichon": "bird", "Apus": "bird", "Tachymarptis": "bird",
    "Columba": "bird", "Streptopelia": "bird", "Zenaida": "bird", "Geopelia": "bird",
    "Gallus": "bird", "Phasianus": "bird", "Pavo": "bird", "Meleagris": "bird",
    "Numida": "bird", "Coturnix": "bird", "Alectoris": "bird", "Perdix": "bird",
    "Anas": "bird", "Anser": "bird", "Branta": "bird", "Cygnus": "bird",
    "Aythya": "bird", "Mergus": "bird", "Somateria": "bird", "Tadorna": "bird",
    "Pelecanus": "bird", "Phalacrocorax": "bird", "Sula": "bird", "Morus": "bird",
    "Ardea": "bird", "Egretta": "bird", "Bubulcus": "bird", "Nycticorax": "bird",
    "Ciconia": "bird", "Mycteria": "bird", "Leptoptilos": "bird", "Platalea": "bird",
    "Phoenicopterus": "bird", "Phoeniconaias": "bird",
    "Larus": "bird", "Sterna": "bird", "Thalasseus": "bird", "Rissa": "bird",
    "Alca": "bird", "Uria": "bird", "Fratercula": "bird", "Pinguinus": "bird",
    "Aptenodytes": "bird", "Pygoscelis": "bird", "Spheniscus": "bird", "Eudyptes": "bird",
    "Diomedea": "bird", "Thalassarche": "bird", "Puffinus": "bird", "Fulmarus": "bird",
    "Psittacus": "bird", "Ara": "bird", "Amazona": "bird", "Cacatua": "bird",
    "Nymphicus": "bird", "Melopsittacus": "bird", "Agapornis": "bird", "Lorius": "bird",
    "Trichoglossus": "bird", "Eclectus": "bird", "Psittacula": "bird",
    "Trochilus": "bird", "Archilochus": "bird", "Calypte": "bird", "Selasphorus": "bird",
    "Apteryx": "bird", "Struthio": "bird", "Dromaius": "bird", "Casuarius": "bird",
    "Rhea": "bird", "Pterocnemia": "bird",
    "Picus": "bird", "Dendrocopos": "bird", "Dryocopus": "bird", "Melanerpes": "bird",
    "Alcedo": "bird", "Ceryle": "bird", "Megaceryle": "bird", "Todiramphus": "bird",
    "Upupa": "bird", "Coracias": "bird", "Merops": "bird", "Buceros": "bird",
    "Aceros": "bird", "Anthracoceros": "bird", "Tockus": "bird",
    "Cuculus": "bird", "Coccyzus": "bird", "Geococcyx": "bird", "Centropus": "bird",
    "Caprimulgus": "bird", "Chordeiles": "bird", "Podargus": "bird",
    "Grus": "bird", "Balearica": "bird", "Anthropoides": "bird", "Otus": "bird",
    "Fulica": "bird", "Gallinula": "bird", "Rallus": "bird", "Crex": "bird",
    "Haematopus": "bird", "Charadrius": "bird", "Vanellus": "bird", "Calidris": "bird",
    "Numenius": "bird", "Limosa": "bird", "Tringa": "bird", "Scolopax": "bird",
    "Gallinago": "bird", "Recurvirostra": "bird", "Himantopus": "bird",
    # Reptiles
    "Crocodylus": "reptile", "Alligator": "reptile", "Caiman": "reptile", "Gavialis": "reptile",
    "Python": "reptile", "Boa": "reptile", "Eunectes": "reptile", "Morelia": "reptile",
    "Naja": "reptile", "Ophiophagus": "reptile", "Bungarus": "reptile", "Dendroaspis": "reptile",
    "Vipera": "reptile", "Crotalus": "reptile", "Bothrops": "reptile", "Bitis": "reptile",
    "Agkistrodon": "reptile", "Trimeresurus": "reptile", "Lachesis": "reptile",
    "Thamnophis": "reptile", "Natrix": "reptile", "Pantherophis": "reptile", "Elaphe": "reptile",
    "Lampropeltis": "reptile", "Coluber": "reptile", "Pituophis": "reptile",
    "Varanus": "reptile", "Heloderma": "reptile", "Lacerta": "reptile", "Podarcis": "reptile",
    "Anolis": "reptile", "Iguana": "reptile", "Cyclura": "reptile", "Chamaeleo": "reptile",
    "Furcifer": "reptile", "Trioceros": "reptile", "Gekko": "reptile", "Phelsuma": "reptile",
    "Hemidactylus": "reptile", "Eublepharis": "reptile", "Tarentola": "reptile",
    "Chelonia": "reptile", "Caretta": "reptile", "Eretmochelys": "reptile", "Dermochelys": "reptile",
    "Testudo": "reptile", "Geochelone": "reptile", "Chelonoidis": "reptile", "Gopherus": "reptile",
    "Emys": "reptile", "Trachemys": "reptile", "Chrysemys": "reptile", "Pseudemys": "reptile",
    "Apalone": "reptile", "Pelodiscus": "reptile", "Macrochelys": "reptile", "Chelydra": "reptile",
    "Sphenodon": "reptile", "Amphisbaena": "reptile",
    # Amphibians
    "Rana": "amphibian", "Lithobates": "amphibian", "Pelophylax": "amphibian", "Hyla": "amphibian",
    "Dryophytes": "amphibian", "Bufo": "amphibian", "Anaxyrus": "amphibian", "Rhinella": "amphibian",
    "Dendrobates": "amphibian", "Oophaga": "amphibian", "Phyllobates": "amphibian",
    "Salamandra": "amphibian", "Ambystoma": "amphibian", "Triturus": "amphibian", "Notophthalmus": "amphibian",
    "Plethodon": "amphibian", "Desmognathus": "amphibian", "Eurycea": "amphibian",
    "Andrias": "amphibian", "Cryptobranchus": "amphibian", "Siren": "amphibian", "Necturus": "amphibian",
    "Caecilia": "amphibian", "Ichthyophis": "amphibian", "Xenopus": "amphibian", "Pipa": "amphibian",
    # Fish
    "Salmo": "fish", "Oncorhynchus": "fish", "Salvelinus": "fish", "Thymallus": "fish",
    "Esox": "fish", "Perca": "fish", "Sander": "fish", "Micropterus": "fish",
    "Cyprinus": "fish", "Carassius": "fish", "Danio": "fish", "Puntius": "fish",
    "Tinca": "fish", "Abramis": "fish", "Rutilus": "fish", "Leuciscus": "fish",
    "Gadus": "fish", "Melanogrammus": "fish", "Pollachius": "fish", "Merluccius": "fish",
    "Thunnus": "fish", "Scomber": "fish", "Xiphias": "fish", "Istiophorus": "fish",
    "Carcharodon": "fish", "Galeocerdo": "fish", "Sphyrna": "fish", "Prionace": "fish",
    "Isurus": "fish", "Cetorhinus": "fish", "Rhincodon": "fish", "Manta": "fish",
    "Mobula": "fish", "Raja": "fish", "Torpedo": "fish", "Dasyatis": "fish",
    "Hippocampus": "fish", "Syngnathus": "fish", "Pterophyllum": "fish", "Symphysodon": "fish",
    "Pterois": "fish", "Amphiprion": "fish", "Pomacanthus": "fish", "Chaetodon": "fish",
    "Balistoides": "fish", "Ostracion": "fish", "Diodon": "fish", "Mola": "fish",
    "Anguilla": "fish", "Muraena": "fish", "Gymnothorax": "fish", "Conger": "fish",
    "Latimeria": "fish", "Neoceratodus": "fish", "Protopterus": "fish", "Polypterus": "fish",
    "Acipenser": "fish", "Polyodon": "fish", "Lepisosteus": "fish", "Amia": "fish",
    "Oreochromis": "fish", "Tilapia": "fish", "Cichla": "fish", "Astronotus": "fish",
    # Insects — butterflies / moths
    "Papilio": "insect", "Pieris": "insect", "Vanessa": "insect", "Nymphalis": "insect",
    "Aglais": "insect", "Inachis": "insect", "Polygonia": "insect", "Limenitis": "insect",
    "Morpho": "insect", "Heliconius": "insect", "Danaus": "insect", "Idea": "insect",
    "Parnassius": "insect", "Colias": "insect", "Gonepteryx": "insect", "Anthocharis": "insect",
    "Lycaena": "insect", "Polyommatus": "insect", "Celastrina": "insect", "Hesperia": "insect",
    "Bombyx": "insect", "Saturnia": "insect", "Actias": "insect", "Attacus": "insect",
    "Hyalophora": "insect", "Antheraea": "insect", "Manduca": "insect", "Sphinx": "insect",
    "Deilephila": "insect", "Macroglossum": "insect", "Acherontia": "insect",
    "Lymantria": "insect", "Orgyia": "insect", "Spodoptera": "insect", "Helicoverpa": "insect",
    "Agrotis": "insect", "Noctua": "insect", "Catocala": "insect",
    # Beetles
    "Coccinella": "insect", "Harmonia": "insect", "Adalia": "insect", "Hippodamia": "insect",
    "Scarabaeus": "insect", "Goliathus": "insect", "Dynastes": "insect", "Lucanus": "insect",
    "Dorcus": "insect", "Cetonia": "insect", "Cotinis": "insect", "Popillia": "insect",
    "Melolontha": "insect", "Phyllophaga": "insect", "Oryctes": "insect",
    "Calosoma": "insect", "Carabus": "insect", "Cicindela": "insect", "Bembidion": "insect",
    "Staphylinus": "insect", "Ocypus": "insect", "Nicrophorus": "insect",
    "Photinus": "insect", "Lampyris": "insect", "Luciola": "insect",
    "Cerambyx": "insect", "Monochamus": "insect", "Anoplophora": "insect", "Rosalia": "insect",
    "Chrysomela": "insect", "Leptinotarsa": "insect", "Diabrotica": "insect",
    "Curculio": "insect", "Anthonomus": "insect", "Sitophilus": "insect",
    # Bees / wasps / ants
    "Apis": "insect", "Bombus": "insect", "Megachile": "insect", "Xylocopa": "insect",
    "Osmia": "insect", "Andrena": "insect", "Halictus": "insect", "Nomia": "insect",
    "Vespa": "insect", "Vespula": "insect", "Polistes": "insect", "Dolichovespula": "insect",
    "Formica": "insect", "Camponotus": "insect", "Lasius": "insect", "Myrmica": "insect",
    "Solenopsis": "insect", "Atta": "insect", "Acromyrmex": "insect", "Oecophylla": "insect",
    "Eciton": "insect", "Dorylus": "insect", "Pogonomyrmex": "insect",
    # Flies / mosquitoes / dragonflies
    "Musca": "insect", "Drosophila": "insect", "Calliphora": "insect", "Lucilia": "insect",
    "Tabanus": "insect", "Chrysops": "insect", "Haematopota": "insect",
    "Aedes": "insect", "Anopheles": "insect", "Culex": "insect", "Culiseta": "insect",
    "Aeshna": "insect", "Anax": "insect", "Libellula": "insect", "Sympetrum": "insect",
    "Calopteryx": "insect", "Ischnura": "insect", "Enallagma": "insect",
    # Grasshoppers / crickets / mantids / stick insects
    "Locusta": "insect", "Schistocerca": "insect", "Melanoplus": "insect", "Chorthippus": "insect",
    "Gryllus": "insect", "Acheta": "insect", "Gryllotalpa": "insect", "Tettigonia": "insect",
    "Mantis": "insect", "Tenodera": "insect", "Hierodula": "insect", "Sphodromantis": "insect",
    "Carausius": "insect", "Extatosoma": "insect", "Phyllium": "insect", "Diapherodes": "insect",
    # Bugs / cicadas / aphids
    "Cimex": "insect", "Triatoma": "insect", "Rhodnius": "insect", "Lygus": "insect",
    "Magicicada": "insect", "Cicada": "insect", "Tibicen": "insect", "Lyristes": "insect",
    "Aphis": "insect", "Myzus": "insect", "Acyrthosiphon": "insect",
    "Gerris": "insect", "Notonecta": "insect", "Nepa": "insect", "Belostoma": "insect",
    # Termites / cockroaches / fleas / lice
    "Reticulitermes": "insect", "Coptotermes": "insect", "Macrotermes": "insect",
    "Periplaneta": "insect", "Blattella": "insect", "Blatta": "insect", "Gromphadorhina": "insect",
    "Pulex": "insect", "Ctenocephalides": "insect", "Xenopsylla": "insect",
    "Pediculus": "insect", "Pthirus": "insect",
    # Arachnids
    "Latrodectus": "arachnid", "Loxosceles": "arachnid", "Atrax": "arachnid", "Hadronyche": "arachnid",
    "Phoneutria": "arachnid", "Lycosa": "arachnid", "Pardosa": "arachnid", "Araneus": "arachnid",
    "Argiope": "arachnid", "Nephila": "arachnid", "Theridion": "arachnid", "Pholcus": "arachnid",
    "Salticus": "arachnid", "Phidippus": "arachnid", "Marpissa": "arachnid",
    "Aphonopelma": "arachnid", "Brachypelma": "arachnid", "Grammostola": "arachnid",
    "Ixodes": "arachnid", "Dermacentor": "arachnid", "Amblyomma": "arachnid", "Rhipicephalus": "arachnid",
    "Scorpiones": "arachnid", "Centruroides": "arachnid", "Androctonus": "arachnid", "Leiurus": "arachnid",
    "Pandinus": "arachnid", "Heterometrus": "arachnid",
    "Limulus": "arachnid", "Tachypleus": "arachnid",
    # Molluscs / other invertebrates often "seen"
    "Octopus": "mollusc", "Enteroctopus": "mollusc", "Sepia": "mollusc", "Loligo": "mollusc",
    "Nautilus": "mollusc", "Architeuthis": "mollusc", "Dosidicus": "mollusc",
    "Helix": "mollusc", "Cornu": "mollusc", "Achatina": "mollusc", "Lissachatina": "mollusc",
    "Limax": "mollusc", "Arion": "mollusc", "Deroceras": "mollusc",
    "Mytilus": "mollusc", "Ostrea": "mollusc", "Crassostrea": "mollusc", "Pecten": "mollusc",
    "Haliotis": "mollusc", "Conus": "mollusc", "Cypraea": "mollusc", "Nerita": "mollusc",
    "Asterias": "other", "Pisaster": "other", "Acanthaster": "other", "Strongylocentrotus": "other",
    "Holothuria": "other", "Cucumaria": "other",
    "Homarus": "other", "Nephrops": "other", "Cancer": "other", "Callinectes": "other",
    "Carcinus": "other", "Pagurus": "other", "Birgus": "other", "Coenobita": "other",
    "Penaeus": "other", "Litopenaeus": "other", "Macrobrachium": "other",
    "Apis": "insect",  # already
}

BIG = {
    "Canis", "Vulpes", "Ursus", "Panthera", "Felis", "Mustela", "Macaca", "Cercopithecus",
    "Equus", "Bos", "Cervus", "Ovis", "Capra", "Gazella", "Sus", "Mus", "Rattus", "Sciurus",
    "Lepus", "Myotis", "Pipistrellus", "Pteropus",
    "Aquila", "Buteo", "Falco", "Accipiter", "Strix", "Bubo", "Corvus", "Passer", "Turdus",
    "Anas", "Anser", "Larus", "Sterna", "Columba", "Streptopelia", "Gallus", "Phasianus",
    "Ara", "Amazona", "Psittacula", "Hirundo", "Parus", "Emberiza", "Calidris", "Tringa",
    "Crocodylus", "Python", "Naja", "Vipera", "Crotalus", "Varanus", "Anolis", "Hemidactylus",
    "Gekko", "Lacerta", "Podarcis", "Trachemys", "Testudo",
    "Rana", "Lithobates", "Bufo", "Hyla", "Ambystoma", "Salamandra", "Dendrobates",
    "Salmo", "Oncorhynchus", "Cyprinus", "Gadus", "Thunnus", "Carcharodon", "Hippocampus",
    "Papilio", "Pieris", "Vanessa", "Heliconius", "Danaus", "Morpho", "Saturnia", "Sphinx",
    "Coccinella", "Carabus", "Cicindela", "Cerambyx", "Curculio", "Apis", "Bombus",
    "Formica", "Camponotus", "Vespa", "Musca", "Drosophila", "Aedes", "Anopheles", "Culex",
    "Locusta", "Melanoplus", "Gryllus", "Mantis", "Magicicada", "Aphis",
    "Araneus", "Lycosa", "Salticus", "Ixodes", "Centruroides",
    "Octopus", "Helix", "Mytilus", "Conus", "Homarus", "Cancer", "Penaeus",
}


def get_json(url: str, retries: int = 3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception:
            if i == retries - 1:
                raise
            time.sleep(1.5 * (i + 1))


def find_genus_id(name: str) -> str | None:
    url = "https://api.checklistbank.org/dataset/3LR/nameusage/search?" + urllib.parse.urlencode(
        {"q": name, "rank": "GENUS", "limit": 10, "status": "accepted"}
    )
    data = get_json(url)
    for r in data.get("result", []):
        if r.get("name") == name and r.get("id"):
            return r["id"]
    if data.get("result"):
        return data["result"][0].get("id")
    return None


def fetch_species(genus_id: str, genus: str):
    species = []
    offset = 0
    limit = 100
    while True:
        url = f"https://api.checklistbank.org/dataset/3LR/tree/{genus_id}/children?" + urllib.parse.urlencode(
            {"limit": limit, "offset": offset}
        )
        data = get_json(url)
        rows = data.get("result", [])
        for row in rows:
            if row.get("rank") != "species":
                continue
            if row.get("status") and row.get("status") != "accepted":
                continue
            latin = row.get("name")
            if not latin or " " not in latin or "×" in latin:
                continue
            species.append(latin)
        total = data.get("total", 0)
        offset += limit
        if offset >= total or not rows or len(species) > 600:
            break
    return genus, species


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def build_seeds(all_species: list[dict], genus_tags: dict[str, str]) -> list[dict]:
    by = defaultdict(list)
    for s in all_species:
        g = s["genus"]
        latin = s["latin"]
        parts = latin.split()
        if len(parts) != 2 or not parts[1].islower():
            continue
        by[g].append(latin)

    seeds = []
    seen = set()
    for g, names in sorted(by.items()):
        names = sorted(set(names))
        cap = 80 if g in BIG else 30
        kind = genus_tags.get(g, "other")
        for latin in names[:cap]:
            sid = slugify(latin)
            if sid in seen or len(sid) > 80:
                continue
            seen.add(sid)
            tags = [kind, g.lower(), "col"]
            if kind == "insect":
                tags.append("insect")
            seeds.append(
                {
                    "id": sid,
                    "name": latin,
                    "aliases": [g.lower()],
                    "tags": tags,
                    "summary": f"{latin} — animal species (Catalogue of Life).",
                }
            )
    return seeds


def main() -> None:
    # de-dupe genera keeping first tag
    genera = {}
    for g, tag in GENERA.items():
        if re.fullmatch(r"[A-Z][a-z]+", g) and g not in genera:
            genera[g] = tag

    print(f"Genera to fetch: {len(genera)}")
    genus_ids = {}
    for i, g in enumerate(genera):
        try:
            gid = find_genus_id(g)
            if gid:
                genus_ids[g] = gid
        except Exception as e:
            print("resolve fail", g, e)
        if (i + 1) % 40 == 0:
            print(f"resolved {i + 1}/{len(genera)}")
        time.sleep(0.05)

    print(f"Resolved {len(genus_ids)}/{len(genera)}")
    all_species = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(fetch_species, gid, g): g for g, gid in genus_ids.items()}
        for fut in as_completed(futs):
            g, result = fut.result()
            if isinstance(result, Exception):
                print("ERR", g, result)
                continue
            genus, species = g, result
            print(f"{genus}: {len(species)}")
            for latin in species:
                all_species.append({"genus": genus, "latin": latin, "kind": genera[genus]})

    raw = {
        "source": "Catalogue of Life via ChecklistBank dataset 3LR",
        "guidance": "Major vertebrate and insect genera (parallel to tree/flower COL expansion)",
        "genusCount": len(genus_ids),
        "speciesCount": len(all_species),
        "species": all_species,
    }
    (OUT / "col-animal-species.json").write_text(json.dumps(raw, indent=1))
    seeds = build_seeds(all_species, genera)
    (OUT / "animal-seeds-col.json").write_text(json.dumps(seeds, indent=1))
    print(f"Wrote {len(all_species)} raw / {len(seeds)} seed species")


if __name__ == "__main__":
    main()
