// What the tunnel canvas exposes to the power-on sequence: the reveal it
// draws out from the centre of the room.
export interface TunnelHandle {
  setRevealRadius(r: number): void;
  getRevealRadius?(): number;
}
