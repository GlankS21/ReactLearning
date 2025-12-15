import { useState } from "react"
import authAPI from "../../api/authAPI";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent"
import ludoBoard from "../../assets/image/ludo board.png"
import { Form } from "antd"
import { LockOutlined, UserOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { WrapperButtonFeild, WrapperInputFeild, WrapperPasswordFeild } from "./style"

const SignUp = () => {
  const [message, setMessage] = useState({ text: "", type: "" })

  const onFinish = async (values) => {
    try {
      setMessage({ text: "", type: "" })

      const response = await authAPI.signup(values.fullName, values.password);

      if (response.success) {
        setMessage({ text: "Регистрация успешна!", type: "success" })
        localStorage.setItem("authToken", response.data.token)
        localStorage.setItem("login", response.data.login)
        setTimeout(() => {
          window.location.href = "/ludohome"
        }, 1500)
      } else {
        setMessage({ text: response.message || "Ошибка регистрации", type: "error" })
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setMessage({ text: error.message || "Произошла ошибка", type: "error" })
    }
  }

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo)
  }

  return (
    <BackgroundComponent opacity={0.8}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <img
          style={{ height: "300px", width: "auto", objectFit: "contain" }}
          src={ludoBoard || "/placeholder.svg"}
          alt="Ludo Board"
          className="responsive-image"
        />
        <div
          style={{
            textTransform: "uppercase",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "30px",
            margin: "20px 0 10px 0",
          }}
          className="responsive-title"
        >
          Регистраця
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Form
            name="signupForm"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item name="fullName" rules={[{ required: true, message: "Пожалуйста, введите свой логин" }]}>
              <WrapperInputFeild
                placeholder="Логин"
                prefix={<UserOutlined style={{ fontSize: "20px", color: "#666" }} />}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Пожалуйста, введите свой пароль!" },
                { min: 6, message: "Пароль должен содержать не менее 6 символов!" },
              ]}
            >
              <WrapperPasswordFeild
                placeholder="Пароль"
                prefix={<LockOutlined style={{ fontSize: "20px", color: "#666" }} />}
              />
            </Form.Item>
            
            {message.text && (
              <div
                style={{
                  marginBottom: "15px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: message.type === "success" ? "#52c41a" : "#ff4d4f",
                  textAlign: "center",
                  maxWidth: "400px",
                  width: "100%",
                }}
              >
                {message.text}
              </div>
            )}

            <Form.Item style={{ marginBottom: "0" }}>
              <WrapperButtonFeild type="primary" htmlType="submit">
                Регистраця <ArrowRightOutlined />
              </WrapperButtonFeild>
            </Form.Item>
          </Form>
        </div>

        <div style={{ color: "#fff", marginTop: "20px" }}>
          Уже есть аккаунт?{" "}
          <a href="/signin" style={{ color: "#D4C0C0", fontWeight: "bold", textDecoration: "none" }}>
            Логин
          </a>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-image {
            height: 200px !important;
          }
          .responsive-title {
            font-size: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .responsive-image {
            height: 150px !important;
          }
          .responsive-title {
            font-size: 20px !important;
          }
        }
      `}</style>
    </BackgroundComponent>
  )
}

export default SignUp