import TRequestType from "./request-type";

type TRequest = {
  type: TRequestType
  requestId: string
  payload: any
}

export default TRequest