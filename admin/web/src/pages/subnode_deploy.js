import React, { useState } from 'react';
import { Button, Form, Select, Spin, Alert } from 'antd';
import { useSession } from "next-auth/react";
import { getSubnodeList } from '/src/helper/chain_registry';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

export async function getServerSideProps({req, res, query}) {
  const session = await getServerSession(req, res, authOptions);
  if (session) {
    const {user} = session;
    if (user) {
      const subnodeList = await getSubnodeList();

      const subnodeOptions = [];
      for (const sn of subnodeList) {
        const opt = {value: sn, label: sn};
        subnodeOptions.push(opt);
      }

      return {props: {subnodeOptions}};
    }
  }

  return {props: {}};
}

export default function SubnodeDeploy({subnodeOptions}) {
  const {data: session, status} = useSession();

  // formState: 0: init, 1: submitting, 2: ok, 3: failed.
  const [formState, setFormState] = useState(0);

  const [responseText, setResponseText] = useState("");

  if (status === "unauthenticated") return <p>Access Denied.</p>

  const onFinish = async (values) => {
    const {chain} = values;
    setFormState(1);

    const apiRes = await fetch('/api/subnode_deploy', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({chain}),
    });
    const {data: apiResText} = await apiRes.json();

    setResponseText(apiResText);

    setFormState(2);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className="SubnodeDeploy">
      <h3>Deploy a Subnode Service</h3>

      {formState === 0 &&
      <Form
        name="basic"
        labelCol={{span: 8}}
        wrapperCol={{span: 16}}
        style={{maxWidth: 600}}
        initialValues={{}}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item label="Chain" name="chain" rules={[{required: true, message: 'Please select a chain'}]}>
          <Select
            showSearch
            style={{
              width: 200,
            }}
            placeholder="Search to Select"
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? '').includes(input)}
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={subnodeOptions}
          />
        </Form.Item>

        <Form.Item wrapperCol={{offset: 8, span: 16}}>
          <Button type="primary" htmlType="submit">Submit</Button>
        </Form.Item>
      </Form>
      }

      {formState === 1 &&
      <Spin tip="Loading...">
        <Alert
          message="Loading..."
          description="Your request is being executed. Please wait!"
          type="info"
        />
      </Spin>
      }

      {formState === 2 && <pre>{responseText}</pre>}

    </div>
  )
}
