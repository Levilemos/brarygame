
export class Usuario {
  constructor(
    public id_usuario: number,
    public nome: string,
    public email: string,
    public senha_hash: string,
    public data_cadastro: Date,
    public foto_perfil: string | null,
    public biografia: string | null
  ) {}
}
