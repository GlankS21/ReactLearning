import { useState } from "react"
import authAPI from "../../api/authAPI";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent"
import ludoBoard from "../../assets/image/ludo board.png"
import { Form } from "antd"
import { LockOutlined, UserOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { WrapperButtonFeild, WrapperInputFeild, WrapperPasswordFeild } from "./style"

const SignUp = () => {
  const [errorMessage, setErrorMessage] = useState("")

  const onFinish = async (values) => {
    try {
      setErrorMessage("")

      const response = await authAPI.signup(values.fullName, values.password);

      if (response.success) {
        alert("Sign up successful! You can now sign in.")
        window.location.href = "/signin"
      } else {
        setErrorMessage(response.message || "Sign up failed")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setErrorMessage("Cannot connect to server")
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
            margin: "20px 0",
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

            {errorMessage && (
              <div
                style={{
                  position: "absolute",
                  bottom: "42px",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  color: "#ff4d4f"
                }}
              >
                {errorMessage}
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