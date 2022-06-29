function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Device Settings</Text>}>
            <TextInput
                label="Device Serial"
                settingsKey="serial"
            />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
