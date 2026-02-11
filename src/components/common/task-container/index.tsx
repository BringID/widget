import React, { FC } from 'react';
import TProps from './types';
import {
  Container,
  Title,
  Subtitle,
  Content,
  ImageWrapper,
  CheckboxStyled,
  Body,
  Footer,
  VerifiedIndicator,
  PontsCount,
  CheckIcon
} from './styled-components';
import { TVerificationStatus } from '@/types';
import { defineTaskIcon } from '@/utils';

const defineDescription = (
  status: TVerificationStatus,
) => {
  if (status === 'completed') {
    return <VerifiedIndicator><CheckIcon />Verified</VerifiedIndicator>
  }
}

const TaskContainer: FC<TProps> = ({
  status,
  children,
  title,
  icon,
  id,
  selectable,
  description,
  selected,
  onSelect,
}) => {
  // const tiers = groups ? defineTiers(groups) : undefined
  const descriptionContent = defineDescription(status)
  const TaskIcon = defineTaskIcon(icon)
  return (
    <Container status={status}>
      <Body selectable={selectable}>
        {selectable && (
          <CheckboxStyled
            checked={Boolean(selected)}
            onClick={onSelect}
            id={id}
          />
        )}
        <ImageWrapper>
          {TaskIcon && <TaskIcon /> }
        </ImageWrapper>
        <Content>
          <Title>{title}</Title>
          <Subtitle>{descriptionContent}</Subtitle>
        </Content>
        {children}
      </Body>
      {status !== 'completed' && description && <Footer>
        {description}
      </Footer>}

    </Container>
  );
};

export default TaskContainer;
