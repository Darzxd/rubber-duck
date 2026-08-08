from playwright.sync_api import sync_playwright
L=".pointer-events-none.absolute.inset-0"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:3000/s/demo?name=Nico", wait_until="domcontentloaded"); pg.wait_for_timeout(1800)
    ps = lambda: pg.evaluate(f"() => document.querySelectorAll('{L} > p').length")

    pg.get_by_role("button", name="Texto", exact=True).click(); pg.wait_for_timeout(300)
    pg.mouse.click(600,300); pg.wait_for_timeout(600)
    pg.mouse.click(1000,600); pg.wait_for_timeout(600)
    print("texto vacio abandonado ->", ps(), "OK" if ps()==0 else "SIGUE EL BUG")

    # con contenido debe quedarse
    pg.get_by_role("button", name="Texto", exact=True).click(); pg.wait_for_timeout(300)
    pg.mouse.click(620,340); pg.wait_for_timeout(600)
    pg.keyboard.type("Sí queda"); pg.wait_for_timeout(300)
    pg.mouse.click(1000,600); pg.wait_for_timeout(600)
    print("texto con contenido   ->", ps(), "OK" if ps()==1 else "FALLA")
    print("visible:", pg.get_by_text("Sí queda", exact=True).count())

    # solo espacios tambien se descarta
    pg.get_by_role("button", name="Texto", exact=True).click(); pg.wait_for_timeout(300)
    pg.mouse.click(660,380); pg.wait_for_timeout(600)
    pg.keyboard.type("   "); pg.wait_for_timeout(300)
    pg.mouse.click(1000,600); pg.wait_for_timeout(600)
    print("texto solo espacios   ->", ps(), "OK" if ps()==1 else "FALLA")
    print("errores:", errs[:3] if errs else "ninguno")
    b.close()
