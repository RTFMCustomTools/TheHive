package org.thp.thehive.dto.v0

import java.util.Date

import org.scalactic.Accumulation._
import org.scalactic.{Bad, Good, One}
import org.thp.scalligraph.InvalidFormatAttributeError
import org.thp.scalligraph.controllers.{FNull, _}
import play.api.libs.json._

case class InputCustomField(
    name: String,
    description: String,
    `type`: String,
    reference: String,
    mandatory: Option[Boolean],
    @WithParser(InputCustomFieldValue.simpleParser)
    options: Seq[InputCustomFieldValue] = Nil
)

object InputCustomField {
  implicit val format: Format[InputCustomField] = Json.format[InputCustomField]
}

case class OutputCustomField(name: String, reference: String, description: String, `type`: String, options: Seq[JsValue], mandatory: Boolean)

object OutputCustomField {
  implicit val format: OFormat[OutputCustomField] = Json.format[OutputCustomField]
}

case class InputCustomFieldValue(name: String, value: Option[Any])

object InputCustomFieldValue {

  val parser: FieldsParser[Seq[InputCustomFieldValue]] = FieldsParser("customFieldValue") {
    case (_, FObject(fields)) =>
      fields
        .toSeq
        .validatedBy {
          case (name, FString(value))   => Good(InputCustomFieldValue(name, Some(value)))
          case (name, FNumber(value))   => Good(InputCustomFieldValue(name, Some(value)))
          case (name, FBoolean(value))  => Good(InputCustomFieldValue(name, Some(value)))
          case (name, FAny(value :: _)) => Good(InputCustomFieldValue(name, Some(value)))
          case (name, FNull)            => Good(InputCustomFieldValue(name, None))
          case (name, other) =>
            Bad(
              One(
                InvalidFormatAttributeError(name, "CustomFieldValue", Set("field: string", "field: number", "field: boolean", "field: string"), other)
              )
            )
        }
        .map(_.toSeq)
    case (_, FUndefined) => Good(Nil)
  }

  val simpleParser: FieldsParser[Seq[InputCustomFieldValue]] = FieldsParser("options") {
    case (_, FSeq(fields)) =>
      fields
        .validatedBy {
          case FString(value)   => Good(InputCustomFieldValue("name", Some(value)))
          case FNumber(value)   => Good(InputCustomFieldValue("name", Some(value)))
          case FBoolean(value)  => Good(InputCustomFieldValue("name", Some(value)))
          case FAny(value :: _) => Good(InputCustomFieldValue("name", Some(value)))
          case FNull            => Good(InputCustomFieldValue("name", None))
          case other =>
            Bad(
              One(
                InvalidFormatAttributeError("name", "CustomFieldValue", Set("string", "number", "boolean", "string"), other)
              )
            )
        }
        .map(_.toSeq)
    case (_, FUndefined) => Good(Nil)
  }

  implicit val writes: Writes[Seq[InputCustomFieldValue]] = Writes[Seq[InputCustomFieldValue]] { icfv =>
    val fields = icfv.map {
      case InputCustomFieldValue(name, Some(s: String))  => name -> JsString(s)
      case InputCustomFieldValue(name, Some(l: Long))    => name -> JsNumber(l)
      case InputCustomFieldValue(name, Some(d: Double))  => name -> JsNumber(d)
      case InputCustomFieldValue(name, Some(i: Integer)) => name -> JsNumber(i.toLong)
      case InputCustomFieldValue(name, Some(f: Float))   => name -> JsNumber(f.toDouble)
      case InputCustomFieldValue(name, Some(b: Boolean)) => name -> JsBoolean(b)
      case InputCustomFieldValue(name, Some(d: Date))    => name -> JsNumber(d.getTime)
      case InputCustomFieldValue(name, None)             => name -> JsNull
      case InputCustomFieldValue(name, other)            => sys.error(s"The custom field $name has invalid value: $other (${other.getClass})")
    }
    JsObject(fields)
  }

  implicit val reads: Reads[Seq[InputCustomFieldValue]] = (json: JsValue) => json
    .validate[Seq[JsValue]]
    .map(_.map {
      case JsString(v) => InputCustomFieldValue("name", Some(v))
      case JsNumber(value) => InputCustomFieldValue("name", Some(value))
      case JsBoolean(value) => InputCustomFieldValue("name", Some(value))
      case JsNull => InputCustomFieldValue("name", None)
      case other => sys.error(s"The custom field has invalid value: $other (${other.getClass})")
    })
}

case class OutputCustomFieldValue(name: String, description: String, tpe: String, value: Option[String])

object OutputCustomFieldValue {
  implicit val format: OFormat[OutputCustomFieldValue] = Json.format[OutputCustomFieldValue]
}
