import enum

from sqlalchemy import Enum


class TipoCuenta(str, enum.Enum):
    en_mesa = "en_mesa"
    para_llevar = "para_llevar"


class EstadoCuenta(str, enum.Enum):
    abierta = "abierta"
    por_cobrar = "por_cobrar"
    pagada = "pagada"
    cancelada = "cancelada"


class EstadoCocina(str, enum.Enum):
    pendiente = "pendiente"
    en_preparacion = "en_preparacion"
    listo = "listo"
    entregado = "entregado"
    cancelado = "cancelado"


class MetodoPago(str, enum.Enum):
    efectivo = "efectivo"
    tarjeta = "tarjeta"
    transferencia = "transferencia"
    otro = "otro"


class TipoMovimiento(str, enum.Enum):
    entrada = "entrada"
    salida = "salida"
    ajuste = "ajuste"


def enum_col(py_enum):
    return Enum(
        py_enum,
        native_enum=False,
        create_constraint=True,
        values_callable=lambda e: [m.value for m in e],
    )
