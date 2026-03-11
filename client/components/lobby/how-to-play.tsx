import { Bomb, Target, Timer, Users, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ReactNode } from "react";
import { Kbd } from "../ui/kbd";

export function HowToPlay({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Så spelar du Word Smash</DialogTitle>
          <DialogDescription>Ett snabbt och samarbetsbaserat ordspel minst 2 spelare</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-2">
          {/* Basic gameplay */}
          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Target className="w-4 h-4 text-tile-foreground" />
              Mål
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Samarbeta med ditt lag för att bygga ett korsordsrutnät med brickor. Koppla ihop ord horisontellt och vertikalt för att samla poäng innan tiden tar slut.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Users className="w-4 h-4 text-tile-foreground" />
              Placera brickor
            </h3>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="font-medium text-foreground">1.</span>
                Klicka på en bricka i din hand längst ner på skärmen
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium text-foreground">2.</span>
                Flytta muspekaren för att placera brickan på spelplanen
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium text-foreground">3.</span>
                Klicka igen för att placera brickan, eller tryck <Kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</Kbd>
                för att avbryta
              </li>
            </ul>
          </section>

          {/* Navigation */}
          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Timer className="w-4 h-4 text-tile-foreground" />
              Navigering
            </h3>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">Panorera:</span>
                Klicka och dra på spelplanen för att flytta runt
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">Zooma:</span>
                Använd mushjulet eller zoomkontrollerna för att zooma in/ut
              </li>
            </ul>
          </section>

          {/* Power-ups */}
          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap className="w-4 h-4 text-tile-foreground" />
              Power-ups
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 border-2 rounded-lg border-tile-primary bg-tile-primary/5">
                <Bomb className="p-2 rounded-lg stroke-2 size-10 border-tile-primary bg-tile-primary/20 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Bomber</p>
                  <p className="text-xs text-muted-foreground">
                    Placera bomber på brickor som redan ligger på spelplanen. Nästa gång brickan används i ett ord sprängs brickorna bort. Men se upp, du kan inte se var du har placerat dina bomber.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Scoring */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground">Poäng</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Varje bokstav har ett poängvärde (visas i hörnet av brickan). Längre ord ger bonuspoäng. Laget med flest poäng när tiden är slut vinner!
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
