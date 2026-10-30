CREATE TABLE usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    data_cadastro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    foto_perfil TEXT,
    biografia TEXT
);

CREATE TABLE jogador (
    id_usuario INTEGER PRIMARY KEY,
    apelido VARCHAR(60) NOT NULL,

    CONSTRAINT fk_jogador_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE administrador (
    id_usuario INTEGER PRIMARY KEY,
    data_nomeacao TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_administrador_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE genero (
    id_genero INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE
);


CREATE TABLE jogo (
    id_jogo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_lancamento DATE,
    imagem_capa TEXT,
    id_administrador INTEGER NOT NULL,

    CONSTRAINT fk_jogo_administrador
        FOREIGN KEY (id_administrador)
        REFERENCES administrador(id_usuario)
);

CREATE TABLE jogo_genero (
    id_jogo INTEGER NOT NULL,
    id_genero INTEGER NOT NULL,

    CONSTRAINT pk_jogo_genero
        PRIMARY KEY (id_jogo, id_genero),

    CONSTRAINT fk_jogo_genero_jogo
        FOREIGN KEY (id_jogo)
        REFERENCES jogo(id_jogo)
        ON DELETE CASCADE,

    CONSTRAINT fk_jogo_genero_genero
        FOREIGN KEY (id_genero)
        REFERENCES genero(id_genero)
);

CREATE TABLE avaliacao (
    id_avaliacao INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nota INTEGER NOT NULL,
    comentario TEXT,
    data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_jogador INTEGER NOT NULL,
    id_jogo INTEGER NOT NULL,

    CONSTRAINT fk_avaliacao_jogador
        FOREIGN KEY (id_jogador)
        REFERENCES jogador(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_avaliacao_jogo
        FOREIGN KEY (id_jogo)
        REFERENCES jogo(id_jogo)
        ON DELETE CASCADE,

    CONSTRAINT ck_avaliacao_nota
        CHECK (nota BETWEEN 0 AND 10),

    CONSTRAINT uq_avaliacao_jogador_jogo
        UNIQUE (id_jogador, id_jogo)
);

CREATE TABLE biblioteca (
    id_biblioteca INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    privacidade VARCHAR(10) NOT NULL DEFAULT 'PUBLICA',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_jogador INTEGER NOT NULL,

    CONSTRAINT fk_biblioteca_jogador
        FOREIGN KEY (id_jogador)
        REFERENCES jogador(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT uq_biblioteca_jogador
        UNIQUE (id_jogador),

    CONSTRAINT ck_biblioteca_privacidade
        CHECK (privacidade IN ('PUBLICA', 'PRIVADA'))
);

CREATE TABLE item_biblioteca (
    id_biblioteca INTEGER NOT NULL,
    id_jogo INTEGER NOT NULL,
    data_adicao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_item_biblioteca
        PRIMARY KEY (id_biblioteca, id_jogo),

    CONSTRAINT fk_item_biblioteca_biblioteca
        FOREIGN KEY (id_biblioteca)
        REFERENCES biblioteca(id_biblioteca)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_biblioteca_jogo
        FOREIGN KEY (id_jogo)
        REFERENCES jogo(id_jogo)
        ON DELETE CASCADE
);

