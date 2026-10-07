# canvas – strefa nauki

Własny renderer tablicy na `<canvas>` bez DOM: pętla `requestAnimationFrame`, kamera (pan/zoom)
i transformacje ekran ↔ świat oraz hit-testing kształtów. Model dokumentu trzymany osobno od widoku,
żeby na etapie 2 dało się go podmienić na Y.Doc.
